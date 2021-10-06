import { domainHash, isKnownDomain } from '@celo/identity/lib/odis/domains'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainStatusResponse,
  ErrorMessage,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { respondWithError } from '../common/error-utils'
import { DOMAINS_STATES_COLUMNS } from '../database/models/domainState'
import { getDomainState, setDomainDisabled } from '../database/wrappers/domainState'
import { Endpoints } from '../server'
import { IDomainService } from './domain.interface'

export class DomainService implements IDomainService {
  public async handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response
  ): Promise<void> {
    const logger = response.locals.logger
    if (!isKnownDomain(request.body.domain)) {
      logger.warn('Received request to disable an unknown domain', {
        name: request.body.domain.name,
        version: request.body.domain.version,
      })
      respondWithError(Endpoints.DISABLE_DOMAIN, response, 404, WarningMessage.UNKNOWN_DOMAIN)
      return
    }
    logger.info('Processing request to disable domain', {
      name: request.body.domain.name,
      version: request.body.domain.version,
      hash: domainHash(request.body.domain),
    })
    try {
      const domainState = await getDomainState(request.body.domain, logger)
      // FIXME(victor): It is technically possible to disable a domain that has never been used,
      // and there are some circustances in which is might be good to be able to do so. This
      // should be fixed such that it is possible.
      if (!domainState) {
        respondWithError(Endpoints.DISABLE_DOMAIN, response, 422, ErrorMessage.DATABASE_GET_FAILURE)
      } else if (domainState.disabled) {
        respondWithError(
          Endpoints.DISABLE_DOMAIN,
          response,
          422,
          ErrorMessage.DOMAIN_ALREADY_DISABLED_FAILURE
        )
      } else {
        return setDomainDisabled(request.body.domain, logger)
      }
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
    if (!isKnownDomain(request.body.domain)) {
      logger.warn('Received request to get quota status for an unknown domain', {
        name: request.body.domain.name,
        version: request.body.domain.version,
      })
      respondWithError(Endpoints.DOMAIN_QUOTA_STATUS, response, 404, WarningMessage.UNKNOWN_DOMAIN)
      return
    }
    logger.info('Processing request to get domain quota status', {
      name: request.body.domain.name,
      version: request.body.domain.version,
      hash: domainHash(request.body.domain),
    })
    try {
      const domainState = await getDomainState(request.body.domain, logger)
      let resultResponse: DomainStatusResponse
      if (domainState) {
        resultResponse = {
          domain: request.body.domain,
          counter: domainState[DOMAINS_STATES_COLUMNS.counter],
          disabled: domainState[DOMAINS_STATES_COLUMNS.disabled],
          timer: domainState[DOMAINS_STATES_COLUMNS.timer],
        }
      } else {
        resultResponse = {
          domain: request.body.domain,
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
}
