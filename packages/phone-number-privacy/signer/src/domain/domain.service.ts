import {
  Domain,
  domainHash,
  isKnownDomain,
  isSequentialDelayDomain,
  KnownDomain,
} from '@celo/identity/lib/odis/domains'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
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
  private static createEmptyDomainState(domain: Domain): DomainState {
    if (isSequentialDelayDomain(domain)) {
      return {
        [DOMAINS_STATES_COLUMNS.domainHash]: domainHash(domain).toString('hex'),
        [DOMAINS_STATES_COLUMNS.counter]: 0,
        [DOMAINS_STATES_COLUMNS.timer]: 0,
        [DOMAINS_STATES_COLUMNS.disabled]: false,
      }
    }

    throw new Error(WarningMessage.UNKNOWN_DOMAIN)
  }

  public constructor(
    private readonly authService: IDomainAuthService,
    private readonly quotaService: IDomainQuotaService
  ) {}

  public async handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response
  ): Promise<void> {
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
        await insertDomainState(DomainService.createEmptyDomainState(domain), trx, logger)
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
          counter: domainState[DOMAINS_STATES_COLUMNS.counter]!,
          disabled: domainState[DOMAINS_STATES_COLUMNS.disabled]!,
          timer: domainState[DOMAINS_STATES_COLUMNS.timer]!,
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

    const trx = await getTransaction()
    let domainState = await getDomainStateWithLock(domain, trx, logger)
    if (!domainState) {
      domainState = await insertDomainState(
        DomainService.createEmptyDomainState(domain),
        trx,
        logger
      )
    }

    const quotaState = await this.quotaService.checkAndUpdateQuota(domain, domainState, trx)

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
      const privateKey = keyProvider.getPrivateKey()
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
