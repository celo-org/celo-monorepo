import {
  DisableDomainResponse,
  Domain,
  DomainEndpoint,
  domainHash,
  domainQuotaStatusRequestSchema,
  DomainQuotaStatusResponse,
  DomainQuotaStatusResponseSuccess,
  DomainRequest,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSuccess,
  ErrorMessage,
  ErrorType,
  isKnownDomain,
  KEY_VERSION_HEADER,
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
import { getDatabase } from '../database/database'
import {
  DomainState,
  DomainStateRecord,
  DOMAINS_STATES_COLUMNS,
} from '../database/models/domainState'
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

// TODO: De-dupe with common package
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
    logger.warn({ error, status, response }, 'Responding with warning')
  } else {
    logger.error({ error, status, response }, 'Responding with error')
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
    const endpoint = Endpoint.DISABLE_DOMAIN
    Counters.requests.labels(endpoint).inc()

    // Check that the body contains the correct request type.
    if (!disableDomainRequestSchema(DomainSchema).is(request.body)) {
      respondWithError(DomainEndpoint.DISABLE_DOMAIN, response, 400, WarningMessage.INVALID_INPUT)
      return
    }

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
    try {
      // Inside a database transaction, update or create the domain to mark it disabled.
      await getDatabase().transaction(async (trx) => {
        const domainState = await getDomainStateWithLock(domain, trx, logger)
        if (!domainState) {
          // If the domain is not currently recorded in the state database, add it now.
          await insertDomainState(DomainStateRecord.createEmptyDomainState(domain), trx, logger)
        }
        if (!(domainState?.disabled ?? false)) {
          await setDomainDisabled(domain, trx, logger)
        }
      })

      response.status(200).send({ success: true, version: getVersion() })
    } catch (error) {
      logger.error('Error while disabling domain', error)
      this.sendFailureResponse(
        response,
        ErrorMessage.DATABASE_UPDATE_FAILURE,
        500,
        endpoint,
        logger
      )
    }
  }

  public async handleGetDomainQuotaStatus(
    request: Request<{}, {}, unknown>,
    response: Response<DomainQuotaStatusResponse>
  ): Promise<void> {
    const endpoint = Endpoint.DOMAIN_QUOTA_STATUS
    Counters.requests.labels(endpoint).inc()

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
      this.sendFailureResponse(response, ErrorMessage.DATABASE_GET_FAILURE, 500, endpoint, logger)
    }
  }

  public async handleGetDomainRestrictedSignature(
    request: Request<{}, {}, unknown>,
    response: Response<DomainRestrictedSignatureResponse>
  ): Promise<void> {
    const endpoint = Endpoint.DOMAIN_SIGN
    Counters.requests.labels(endpoint).inc()

    // Check that the body contains the correct request type.
    if (!domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)) {
      respondWithError(DomainEndpoint.DOMAIN_SIGN, response, 400, WarningMessage.INVALID_INPUT)
      return
    }

    Counters.requests.labels(endpoint).inc()
    const logger = response.locals.logger

    if (!config.api.domains.enabled) {
      this.sendFailureResponse(response, WarningMessage.API_UNAVAILABLE, 501, endpoint, logger)
      return
    }

    const { domain, blindedMessage } = request.body
    if (!this.authenticateRequest(domain, response, DomainEndpoint.DOMAIN_SIGN, logger)) {
      // authenticateRequest returns a response to the user internally. Nothing left to do.
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
      let signature: string | undefined
      await getDatabase().transaction(async (trx) => {
        // Get the current domain state record, or use an empty record one does not exist.
        const domainState =
          (await getDomainStateWithLock(domain, trx, logger)) ??
          DomainStateRecord.createEmptyDomainState(domain)

        if (!this.nonceCheck(request, response, domainState, endpoint, logger)) {
          return
        }

        if (domainState[DOMAINS_STATES_COLUMNS.disabled]) {
          logger.warn(`Domain is disabled`, {
            name: domain.name,
            version: domain.version,
            hash: domainHash(domain),
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
            logger.warn(`Exceeded quota`, {
              name: domain.name,
              version: domain.version,
              hash: domainHash(domain),
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

        // Compute the signature inside the transaction such that it will rollback on error.
        const keyProvider = getKeyProvider()
        const privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
        signature = computeBlindedSignature(blindedMessage, privateKey, logger)
      })

      // TODO(victor): Checking the existance of the sigature to determine whether this operation
      // succeeded is a little clunky. Refactor this to improve the flow.
      if (signature) {
        const signMessageResponseSuccess: DomainRestrictedSignatureResponseSuccess = {
          success: true,
          version: getVersion(),
          signature,
        }
        response
          .status(200)
          .set(KEY_VERSION_HEADER, key.version.toString())
          .json(signMessageResponseSuccess)
      }
    } catch (err) {
      logger.error('Failed to get signature for a domain')
      logger.error(err)
      this.sendFailureResponse(response, ErrorMessage.UNKNOWN_ERROR, 500, endpoint, logger)
    }
  }

  private authenticateRequest(
    domain: Domain,
    request: Request<{}, {}, DomainRequest>,
    response: Response,
    endpoint: DomainEndpoint,
    logger: Logger
  ): boolean {
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
