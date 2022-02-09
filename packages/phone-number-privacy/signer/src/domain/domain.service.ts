import {
  DisableDomainRequest,
  DisableDomainResponse,
  Domain,
  domainHash,
  DomainQuotaStatusRequest,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseSuccess,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSuccess,
  ErrorMessage,
  ErrorType,
  isKnownDomain,
  KEY_VERSION_HEADER,
  KnownDomain,
  KnownDomainState,
  respondWithError,
  SignerEndpoint as Endpoint,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { Counters } from '../common/metrics'
import config, { getVersion } from '../config'
import { getTransaction } from '../database/database'
import { DomainState, DOMAINS_STATES_COLUMNS } from '../database/models/domainState'
import { getDomainRequestExists, storeDomainRequest } from '../database/wrappers/domainRequest'
import {
  getDomainState,
  getDomainStateWithLock,
  insertDomainState,
  setDomainDisabled,
} from '../database/wrappers/domainState'
import { getKeyProvider } from '../key-management/key-provider'
import { DefaultKeyName, Key } from '../key-management/key-provider-base'
import { IDomainAuthService } from './auth/domainAuth.interface'
import { IDomainService } from './domain.interface'
import { IDomainQuotaService } from './quota/domainQuota.interface'

// TODO(Alec): Carefully review this file

export class DomainService implements IDomainService {
  public constructor(
    private authService: IDomainAuthService,
    private quotaService: IDomainQuotaService
  ) {}

  public async handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response<DisableDomainResponse>
  ): Promise<void> {
    const endpoint = Endpoint.DISABLE_DOMAIN

    const logger = response.locals.logger
    Counters.requests.labels(endpoint).inc()

    if (!config.api.domains.enabled) {
      this.sendFailureResponse(response, WarningMessage.API_UNAVAILABLE, 501, endpoint, logger)
      return
    }

    const domain = request.body.domain
    if (!this.inputValidation(domain, request, response, endpoint, logger)) {
      // inputValidation returns a response to the user internally. Nothing left to do.
      return
    }

    logger.info('Processing request to disable domain', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    const trx = await getTransaction()
    try {
      const domainState = await getDomainStateWithLock(domain, trx, logger)

      if (!domainState) {
        // If the domain is not currently recorded in the state database, add it now.
        await insertDomainState(DomainState.createEmptyDomainState(domain), trx, logger)
        await trx.commit()
      }
      if (!(domainState?.disabled ?? false)) {
        await setDomainDisabled(domain, logger)
      }
      response.status(200).send({ success: true, version: getVersion() })
      return
    } catch (error) {
      logger.error('Error while disabling domain', error)
      this.sendFailureResponse(
        response,
        ErrorMessage.DATABASE_UPDATE_FAILURE,
        500,
        endpoint,
        logger
      )
      trx.rollback(error)
    }
  }

  public async handleGetDomainQuotaStatus(
    request: Request<{}, {}, DomainQuotaStatusRequest>,
    response: Response<DomainQuotaStatusResponse>
  ): Promise<void> {
    const endpoint = Endpoint.DOMAIN_QUOTA_STATUS

    const logger = response.locals.logger
    Counters.requests.labels(endpoint).inc()

    if (!config.api.domains.enabled) {
      this.sendFailureResponse(response, WarningMessage.API_UNAVAILABLE, 501, endpoint, logger)
      return
    }

    const domain = request.body.domain
    if (!this.inputValidation(domain, request, response, endpoint, logger)) {
      // inputValidation returns a response to the user internally. Nothing left to do.
      return
    }

    logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    try {
      const domainState = await getDomainState(domain, logger)
      let quotaStatus: KnownDomainState
      if (domainState) {
        quotaStatus = {
          counter: domainState[DOMAINS_STATES_COLUMNS.counter] ?? 0,
          disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
          timer: domainState[DOMAINS_STATES_COLUMNS.timer] ?? 0,
        }
      } else {
        quotaStatus = {
          counter: 0,
          disabled: false,
          timer: 0,
        }
      }

      const resultResponse: DomainQuotaStatusResponseSuccess = {
        success: true,
        version: getVersion(),
        status: quotaStatus,
      }
      response.status(200).send(resultResponse)
    } catch (error) {
      logger.error('Error while getting domain status', error)
      this.sendFailureResponse(response, ErrorMessage.DATABASE_GET_FAILURE, 500, endpoint, logger)
    }
  }

  public async handleGetDomainRestrictedSignature(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<void> {
    const endpoint = Endpoint.DOMAIN_SIGN

    Counters.requests.labels(endpoint).inc()
    const logger = response.locals.logger

    if (!config.api.domains.enabled) {
      this.sendFailureResponse(response, WarningMessage.API_UNAVAILABLE, 501, endpoint, logger)
      return
    }

    const { domain, blindedMessage } = request.body

    if (!this.inputValidation(domain, request, response, endpoint, logger)) {
      // inputValidation returns a response to the user internally. Nothing left to do.
      return
    }
    logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    let keyVersion = Number(request.headers[KEY_VERSION_HEADER])
    if (Number.isNaN(keyVersion)) {
      logger.warn('Supplied keyVersion in request header is NaN')
      keyVersion = config.keystore.keys.domains.latest
    }

    const key: Key = {
      name: DefaultKeyName.DOMAINS,
      version: keyVersion,
    }

    try {
      const trx = await getTransaction()
      let domainState = await getDomainStateWithLock(domain, trx, logger)

      if (!this.nonceCheck(request, response, domainState, endpoint, logger)) {
        return
      }

      if (!domainState) {
        domainState = await insertDomainState(
          DomainState.createEmptyDomainState(domain),
          trx,
          logger
        )
      }
      if (domainState[DOMAINS_STATES_COLUMNS.disabled]) {
        logger.warn(`Domain is disabled`, {
          name: domain.name,
          version: domain.version,
        })
        this.sendFailureResponse(response, WarningMessage.DISABLED_DOMAIN, 403, endpoint, logger)
        return
      }

      if (await getDomainRequestExists(domain, blindedMessage, trx, logger)) {
        Counters.duplicateRequests.inc() // TODO(Alec)
        logger.debug(
          'Signature request already exists in db. Will not store request or increment counter.'
        )
      } else {
        await storeDomainRequest(domain, blindedMessage, trx, logger)
        const quotaState = await this.quotaService.checkAndUpdateQuota(
          domain,
          domainState,
          trx,
          logger
        )
        if (!quotaState.sufficient) {
          trx.rollback()
          logger.warn(`Exceeded quota`, {
            name: domain.name,
            version: domain.version,
          })
          this.sendFailureResponse(
            response,
            WarningMessage.EXCEEDED_QUOTA,
            429,
            endpoint,
            logger,
            quotaState.newState.timer
          )
          return
        }
      }

      let signature: string
      try {
        const keyProvider = getKeyProvider()
        const privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
        signature = computeBlindedSignature(request.body.blindedMessage, privateKey, logger)
      } catch (err) {
        trx.rollback()
        throw err
      }

      try {
        trx.commit()
        const signMessageResponseSuccess: DomainRestrictedSignatureResponseSuccess = {
          success: true,
          version: getVersion(),
          signature,
        }
        response.set(KEY_VERSION_HEADER, key.version.toString()).json(signMessageResponseSuccess)
      } catch (err) {
        trx.rollback()
        throw err
      }
    } catch (err) {
      logger.error('Failed to get signature for a domain')
      logger.error(err)
      this.sendFailureResponse(response, ErrorMessage.UNKNOWN_ERROR, 500, endpoint, logger)
    }
  }

  private inputValidation(
    domain: Domain,
    request: Request<{}, {}, DomainRequest>,
    response: Response,
    endpoint: Endpoint,
    logger: Logger
  ): domain is KnownDomain {
    if (!this.authService.authCheck(request.body, endpoint, logger)) {
      logger.warn(`Received unauthorized request to ${endpoint} `, {
        name: domain.name,
        version: domain.version,
      })
      this.sendFailureResponse(response, WarningMessage.UNAUTHENTICATED_USER, 401, endpoint, logger)
      return false
    }

    if (!isKnownDomain(domain)) {
      logger.warn(`Received request to ${endpoint} for an unknown domain`, {
        name: domain.name,
        version: domain.version,
      })
      this.sendFailureResponse(response, WarningMessage.UNKNOWN_DOMAIN, 404, endpoint, logger)
      return false
    }

    return true
  }

  private sendFailureResponse(
    response: Response,
    error: ErrorType,
    status: number,
    endpoint: SignerEndpoint,
    logger: Logger,
    retryAfterMs: number = 0
  ) {
    Counters.responses.labels(endpoint, status.toString()).inc()
    respondWithError(
      response,
      {
        success: false,
        error,
        version: getVersion(),
        retryAfter: Math.ceil(retryAfterMs / 1000),
        date: Math.round(Date.now() / 1000),
      },
      status,
      logger
    )
  }

  private nonceCheck(
    request: Request<{}, {}, DomainRequest>,
    response: Response,
    domainState: DomainState | null,
    endpoint: Endpoint,
    logger: Logger
  ): boolean {
    if (!domainState) {
      domainState = DomainState.createEmptyDomainState(request.body.domain)
    }
    if (!this.authService.nonceCheck(request.body, domainState, logger)) {
      this.sendFailureResponse(response, WarningMessage.UNAUTHENTICATED_USER, 401, endpoint, logger)
      return false
    }
    return true
  }
}
