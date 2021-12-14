import { Domain, domainHash, isKnownDomain, KnownDomain } from '@celo/identity/lib/odis/domains'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  DomainStatusResponse,
  ErrorMessage,
  KeyName,
  KEY_VERSION_HEADER,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { respondWithError } from '../common/error-utils'
import { Counters } from '../common/metrics'
import config, { getVersion } from '../config'
import { getTransaction } from '../database/database'
import { DomainState, DOMAINS_STATES_COLUMNS } from '../database/models/domainState'
import {
  getDomainState,
  getDomainStateWithLock,
  insertDomainState,
  setDomainDisabled,
} from '../database/wrappers/domainState'
import { getKeyProvider } from '../key-management/key-provider'
import { Key } from '../key-management/key-provider-base'
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
    if (!this.inputValidation(domain, response, Endpoints.DISABLE_DOMAIN, logger)) {
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
        await insertDomainState(DomainState.createEmptyDomainState(domain), trx, logger)
        await trx.commit()
      } else if (domainState.disabled) {
        // If the domain is already disabled, nothing needs to be done. Return 200 OK.
        return
      }

      return setDomainDisabled(domain, logger)
    } catch (error) {
      logger.error('Error while disabling domain', error)
      respondWithError(
        Endpoints.DISABLE_DOMAIN,
        response,
        500,
        ErrorMessage.DATABASE_UPDATE_FAILURE
      )
    }
  }

  public async handleGetDomainQuotaStatus(
    request: Request<{}, {}, DomainQuotaStatusRequest>,
    response: Response
  ): Promise<void> {
    Counters.requests.labels(Endpoints.DOMAIN_QUOTA_STATUS).inc()

    const logger = response.locals.logger
    const domain = request.body.domain
    if (!this.inputValidation(domain, response, Endpoints.DOMAIN_QUOTA_STATUS, logger)) {
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
    if (!this.inputValidation(domain, response, Endpoints.DOMAIN_SIGN, logger)) {
      return
    }
    logger.info('Processing request to get domain signature ', {
      name: domain.name,
      version: domain.version,
      hash: domainHash(domain),
    })

    const key: Key = {
      name: KeyName.DOMAINS,
      version: Number(request.headers[KEY_VERSION_HEADER]) || config.keystore.keys.domains.latest,
    }

    try {
      const trx = await getTransaction()
      let domainState = await getDomainStateWithLock(domain, trx, logger)
      if (!domainState) {
        domainState = await insertDomainState(
          DomainState.createEmptyDomainState(domain),
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
        respondWithError(Endpoints.DOMAIN_SIGN, response, 403, WarningMessage.EXCEEDED_QUOTA)
        return
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
        const signMessageResponseSuccess: SignMessageResponseSuccess = {
          success: true,
          signature,
          version: getVersion(),
        }
        response.json(signMessageResponseSuccess)
      } catch (err) {
        trx.rollback()
        throw err
      }
    } catch (err) {
      logger.error('Failed to get signature for a domain')
      logger.error(err)
      respondWithError(Endpoints.DOMAIN_SIGN, response, 500, ErrorMessage.UNKNOWN_ERROR)
    }
  }

  private inputValidation(
    domain: Domain,
    response: Response,
    endpoint: Endpoints,
    logger: Logger
  ): domain is KnownDomain {
    if (!this.authService.authCheck()) {
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
}
