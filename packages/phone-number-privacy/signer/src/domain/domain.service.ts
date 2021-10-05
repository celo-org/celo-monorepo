import {
  DisableDomainRequest,
  DomainRestrictedSignatureRequest,
  DomainStatusResponse,
  ErrorMessage,
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
    logger.info('Disabling domain', { domain: request.body.domain })
    return getDomainState(request.body.domain, logger)
      .then((domainState) => {
        if (!domainState) {
          respondWithError(
            Endpoints.DISABLE_DOMAIN,
            response,
            422,
            ErrorMessage.DATABASE_GET_FAILURE
          )
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
      })
      .catch((e) => {
        logger.error('Error while disabling domain', e)
        respondWithError(
          Endpoints.DISABLE_DOMAIN,
          response,
          500,
          ErrorMessage.DATABASE_UPDATE_FAILURE
        )
      })
  }

  public async handleGetDomainStatus(
    request: Request<{}, {}, DomainRestrictedSignatureRequest>,
    response: Response
  ): Promise<void> {
    const logger = response.locals.logger
    logger.info('Getting domain status', { domain: request.body.domain })
    getDomainState(request.body.domain, logger)
      .then((result) => {
        let resultResponse: DomainStatusResponse
        if (result) {
          resultResponse = {
            domain: result[DOMAINS_STATES_COLUMNS.domain],
            counter: result[DOMAINS_STATES_COLUMNS.counter],
            disabled: result[DOMAINS_STATES_COLUMNS.disabled],
            timer: result[DOMAINS_STATES_COLUMNS.timer],
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
      })
      .catch((e) => {
        logger.error('Error while getting domain status', e)
        respondWithError(Endpoints.DOMAIN_STATUS, response, 500, ErrorMessage.DATABASE_GET_FAILURE)
      })
  }
}
