import {
  DomainRequestBody,
  DomainStatusResponse,
  ErrorMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { respondWithError } from '../common/error-utils'
import { DOMAINS_COLUMNS } from '../database/models/domain'
import { getDomain, setDomainDisabled } from '../database/wrappers/domain'
import { Endpoints } from '../server'
import { IDomainService } from './domain.interface'

export class DomainService implements IDomainService {
  public async handleDisableDomain(
    request: Request<{}, {}, DomainRequestBody>,
    response: Response
  ): Promise<void> {
    const logger = response.locals.logger
    logger.info('Disabling domain', { domain: request.body.domain })

    return setDomainDisabled(request.body.domain, logger)
      .then((result) => {
        if (result) {
          response.sendStatus(200)
        } else {
          respondWithError(
            Endpoints.DISABLE_DOMAIN,
            response,
            500,
            ErrorMessage.DATABASE_UPDATE_FAILURE
          )
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
    request: Request<{}, {}, DomainRequestBody>,
    response: Response
  ): Promise<void> {
    const logger = response.locals.logger
    logger.info('Getting domain status', { domain: request.body.domain })
    getDomain(request.body.domain, logger)
      .then((result) => {
        if (result) {
          const resultResponse: DomainStatusResponse = {
            domain: result[DOMAINS_COLUMNS.domain],
            counter: result[DOMAINS_COLUMNS.counter],
            disabled: result[DOMAINS_COLUMNS.disabled],
            timer: result[DOMAINS_COLUMNS.timer],
          }
          response.status(200).send(resultResponse)
        } else {
          respondWithError(
            Endpoints.DOMAIN_STATUS,
            response,
            500,
            ErrorMessage.DATABASE_GET_FAILURE
          )
        }
      })
      .catch((e) => {
        logger.error('Error while getting domain status', e)
        respondWithError(Endpoints.DISABLE_DOMAIN, response, 500, ErrorMessage.DATABASE_GET_FAILURE)
      })
  }
}
