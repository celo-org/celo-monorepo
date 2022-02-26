import {
  disableDomainRequestSchema,
  DisableDomainResponse,
  Domain,
  DomainEndpoint,
  domainHash,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseSuccess,
  DomainResponse,
  domainRestrictedSignatureRequestSchema,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSuccess,
  DomainSchema,
  DomainState,
  ErrorMessage,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { Counters } from '../common/metrics'
import { getVersion } from '../config'
import { getTransaction } from '../database/database'
import { DOMAINS_STATES_COLUMNS, DomainStateRecord } from '../database/models/domainState'
import {
  getDomainState,
  getDomainStateWithLock,
  insertDomainState,
  setDomainDisabled,
} from '../database/wrappers/domainState'
import { getKeyProvider } from '../key-management/key-provider'
import { IDomainAuthService } from './auth/domainAuth.interface'
import { IDomainService } from './domain.interface'
import { IDomainQuotaService } from './quota/domainQuota.interface'

function respondWithError(
  endpoint: DomainEndpoint,
  res: Response<DomainResponse & { success: false }>,
  status: number,
  error: ErrorMessage | WarningMessage
) {
  const response: DomainResponse = {
    success: false,
    version: getVersion(),
    error,
  }

  const logger: Logger = res.locals.logger

  if (error in WarningMessage) {
    logger.warn({ endpoint, error, status, response }, 'Responding with warning')
  } else {
    logger.error({ endpoint, error, status, response }, 'Responding with error')
  }

  Counters.responses.labels(endpoint, status.toString()).inc()
  res.status(status).json(response)
}

export class DomainService implements IDomainService {
  public constructor(
    private authService: IDomainAuthService,
    private quotaService: IDomainQuotaService
  ) {}

  public async handleDisableDomain(
    request: Request<{}, {}, unknown>,
    response: Response<DisableDomainResponse>
  ): Promise<void> {
    Counters.requests.labels(DomainEndpoint.DISABLE_DOMAIN).inc()

    // Check that the body contains the correct request type.
    if (!disableDomainRequestSchema(DomainSchema).is(request.body)) {
      respondWithError(DomainEndpoint.DISABLE_DOMAIN, response, 400, WarningMessage.INVALID_INPUT)
      return
    }

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.authenticateRequest(domain, response, DomainEndpoint.DISABLE_DOMAIN, logger)) {
      // authenticateRequest returns a response to the user internally. Nothing left to do.
      return
    }

    logger.info('Processing request to disable domain', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    try {
      const trx = await getTransaction()
      const domainState = await getDomainStateWithLock(domain, trx, logger)
      if (!domainState) {
        // If the domain is not currently recorded in the state database, add it now.
        await insertDomainState(DomainStateRecord.createEmptyDomainState(domain), trx, logger)
        await trx.commit()
      }
      if (!(domainState?.disabled ?? false)) {
        await setDomainDisabled(domain, logger)
      }
      response.status(200).send({ success: true, version: getVersion() })
      return
    } catch (error) {
      logger.error('Error while disabling domain', error)
      respondWithError(
        DomainEndpoint.DISABLE_DOMAIN,
        response,
        500,
        ErrorMessage.DATABASE_UPDATE_FAILURE
      )
    }
  }

  public async handleGetDomainQuotaStatus(
    request: Request<{}, {}, unknown>,
    response: Response<DomainQuotaStatusResponse>
  ): Promise<void> {
    Counters.requests.labels(DomainEndpoint.DOMAIN_QUOTA_STATUS).inc()

    // Check that the body contains the correct request type.
    if (!domainQuotaStatusRequestSchema(DomainSchema).is(request.body)) {
      respondWithError(
        DomainEndpoint.DOMAIN_QUOTA_STATUS,
        response,
        400,
        WarningMessage.INVALID_INPUT
      )
      return
    }

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.authenticateRequest(domain, response, DomainEndpoint.DOMAIN_QUOTA_STATUS, logger)) {
      // authenticateRequest returns a response to the user internally. Nothing left to do.
      return
    }

    logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    try {
      const domainState = await getDomainState(domain, logger)
      let quotaStatus: DomainState
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
      respondWithError(
        DomainEndpoint.DOMAIN_QUOTA_STATUS,
        response,
        500,
        ErrorMessage.DATABASE_GET_FAILURE
      )
    }
  }

  public async handleGetDomainRestrictedSignature(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<void> {
    Counters.requests.labels(DomainEndpoint.DOMAIN_SIGN).inc()

    // Check that the body contains the correct request type.
    if (!domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)) {
      respondWithError(DomainEndpoint.DOMAIN_SIGN, response, 400, WarningMessage.INVALID_INPUT)
      return
    }

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.authenticateRequest(domain, response, DomainEndpoint.DOMAIN_SIGN, logger)) {
      // authenticateRequest returns a response to the user internally. Nothing left to do.
      return
    }
    logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    try {
      const trx = await getTransaction()
      let domainState = await getDomainStateWithLock(domain, trx, logger)
      if (!domainState) {
        domainState = await insertDomainState(
          DomainStateRecord.createEmptyDomainState(domain),
          trx,
          logger
        )
      }

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
        respondWithError(DomainEndpoint.DOMAIN_SIGN, response, 403, WarningMessage.EXCEEDED_QUOTA)
        return
      }

      let signature: string
      try {
        const keyProvider = getKeyProvider()
        const privateKey = keyProvider.getPrivateKey()
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
        response.json(signMessageResponseSuccess)
      } catch (err) {
        trx.rollback()
        throw err
      }
    } catch (err) {
      logger.error('Failed to get signature for a domain')
      logger.error(err)
      respondWithError(DomainEndpoint.DOMAIN_SIGN, response, 500, ErrorMessage.UNKNOWN_ERROR)
    }
  }

  private authenticateRequest(
    domain: Domain,
    response: Response,
    endpoint: DomainEndpoint,
    logger: Logger
  ): boolean {
    if (!this.authService.authCheck()) {
      logger.warn(`Received unauthorized request to ${endpoint} `, {
        name: domain.name,
        version: domain.version,
      })
      respondWithError(endpoint, response, 403, WarningMessage.UNAUTHENTICATED_USER)
      return false
    }

    return true
  }
}
