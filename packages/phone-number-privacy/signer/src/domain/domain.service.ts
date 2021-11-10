import { Domain, domainHash, isKnownDomain, KnownDomain } from '@celo/identity/lib/odis/domains'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  DomainStatusResponse,
  ErrorMessage,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { respondWithError } from '../common/error-utils'
import { Counters } from '../common/metrics'
import { getVersion } from '../config'
import { getTransaction } from '../database/database'
import { DOMAINS_STATES_COLUMNS, DomainState } from '../database/models/domainState'
import {
  getDomainState,
  getDomainStateWithLock,
  insertDomainState,
  setDomainDisabled,
} from '../database/wrappers/domainState'
import { getKeyProvider } from '../key-management/key-provider'
import { Endpoints } from '../server'
import { IDomainAuthService } from './auth/domainAuth.interface'
import { IDomainService } from './domain.interface'
import { IDomainQuotaService } from './quota/domainQuota.interface'

export class DomainService implements IDomainService {
  public constructor(
    private authService: IDomainAuthService,
    private quotaService: IDomainQuotaService
  ) {}

  public async handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response
  ): Promise<void> {
    Counters.requests.labels(Endpoints.DISABLE_DOMAIN).inc()

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.inputValidation(domain, request, response, Endpoints.DISABLE_DOMAIN, logger)) {
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
      } else if (domainState.disabled) {
        await trx.commit()
        response.sendStatus(200)
        // If the domain is already disabled, nothing needs to be done. Return 200 OK.
        return
      }

      await setDomainDisabled(domain, logger)
      await trx.commit()
      response.sendStatus(200)
    } catch (error) {
      logger.error('Error while disabling domain', error)
      respondWithError(
        Endpoints.DISABLE_DOMAIN,
        response,
        500,
        ErrorMessage.DATABASE_UPDATE_FAILURE
      )
      trx.rollback(error)
    }
  }

  public async handleGetDomainQuotaStatus(
    request: Request<{}, {}, DomainQuotaStatusRequest>,
    response: Response
  ): Promise<void> {
    Counters.requests.labels(Endpoints.DOMAIN_QUOTA_STATUS).inc()

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.inputValidation(domain, request, response, Endpoints.DOMAIN_QUOTA_STATUS, logger)) {
      return
    }

    logger.info('Processing request to get domain quota status', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })
    try {
      const domainState = await getDomainState(domain, logger)

      let resultResponse: DomainStatusResponse
      if (domainState) {
        resultResponse = {
          domain,
          counter: domainState[DOMAINS_STATES_COLUMNS.counter] ?? 0,
          disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
          timer: domainState[DOMAINS_STATES_COLUMNS.timer] ?? 0,
        }
      } else {
        resultResponse = {
          domain,
          counter: 0,
          disabled: false,
          timer: 0,
        }
      }
      response.status(200).send(resultResponse)
    } catch (error) {
      logger.error('Error while getting domain status', error)
      respondWithError(
        Endpoints.DOMAIN_QUOTA_STATUS,
        response,
        500,
        ErrorMessage.DATABASE_GET_FAILURE
      )
    }
  }

  public async handleGetDomainRestrictedSignature(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    response: Response
  ): Promise<void> {
    Counters.requests.labels(Endpoints.DOMAIN_SIGN).inc()

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.inputValidation(domain, request, response, Endpoints.DOMAIN_SIGN, logger)) {
      return
    }
    logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    const trx = await getTransaction()
    try {
      let domainState = await getDomainStateWithLock(domain, trx, logger)
      if (!this.nonceCheck(request, domainState, response, Endpoints.DOMAIN_QUOTA_STATUS, logger)) {
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
        respondWithError(Endpoints.DOMAIN_SIGN, response, 400, WarningMessage.DISABLED_DOMAIN)
        return
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
        respondWithError(Endpoints.DOMAIN_SIGN, response, 403, WarningMessage.EXCEEDED_QUOTA)
        return
      }

      const keyProvider = getKeyProvider()
      const privateKey = keyProvider.getPrivateKey()
      const signature = computeBlindedSignature(request.body.blindedMessage, privateKey, logger)
      trx.commit()
      const signMessageResponseSuccess: SignMessageResponseSuccess = {
        success: true,
        signature,
        version: getVersion(),
      }
      response.json(signMessageResponseSuccess)
    } catch (err) {
      logger.error('Failed to get signature for a domain')
      logger.error(err)
      respondWithError(Endpoints.DOMAIN_SIGN, response, 500, ErrorMessage.UNKNOWN_ERROR)
      trx.rollback(err)
    }
  }

  private inputValidation(
    domain: Domain,
    request: Request<{}, {}, DomainRequest>,
    response: Response,
    endpoint: Endpoints,
    logger: Logger
  ): domain is KnownDomain {
    if (!this.authService.authCheck(request.body, endpoint, logger)) {
      logger.warn(`Received unauthorized request to ${endpoint} `, {
        name: domain.name,
        version: domain.version,
      })
      respondWithError(endpoint, response, 403, WarningMessage.UNAUTHENTICATED_USER)
      return false
    }

    if (!isKnownDomain(domain)) {
      logger.warn(`Received request to ${endpoint} for an unknown domain`, {
        name: domain.name,
        version: domain.version,
      })
      respondWithError(endpoint, response, 404, WarningMessage.UNKNOWN_DOMAIN)
      return false
    }

    return true
  }

  private nonceCheck(
    request: Request<{}, {}, DomainRequest>,
    domainState: DomainState | null,
    response: Response,
    endpoint: Endpoints,
    logger: Logger
  ): boolean {
    if (domainState && !this.authService.nonceCheck(request.body, domainState, logger)) {
      respondWithError(endpoint, response, 403, WarningMessage.UNAUTHENTICATED_USER)
      return false
    }
    return true
  }
}
