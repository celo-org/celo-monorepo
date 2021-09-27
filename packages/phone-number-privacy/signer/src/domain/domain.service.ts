import { DisableDomainRequestBody } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import * as core from 'express-serve-static-core'
import { getDomain, setDomainDisabled } from '../database/wrappers/domain'
import { IDomainService } from './domain.interface'
import { DOMAINS_COLUMNS } from '../database/models/domain'
import { DomainStatusResponse } from './response/domainStatus.response'

export class DomainService implements IDomainService {
  constructor() {}

  public async handleDisableDomain(
    request: Request<core.ParamsDictionary, {}, DisableDomainRequestBody>,
    response: Response
  ): Promise<void> {
    const logger = response.locals.logger
    logger.info('Disabling domain', { domain: request.params.domain })

    const disabled = request.body.value ?? true
    const result = await setDomainDisabled(request.params.domain, disabled, logger)

    if (result) {
      response.sendStatus(200)
    } else {
      response.status(500).send({ message: 'Cannot disable the domain' })
    }
  }

  public async handleGetDomainStatus(
    request: Request<core.ParamsDictionary, {}, {}>,
    response: Response
  ): Promise<void> {
    const logger = response.locals.logger
    logger.info('Getting domain status', { domain: request.params.domain })
    const result = await getDomain(request.params.domain, logger)

    if (result) {
      const resultResponse: DomainStatusResponse = {
        domain: result[DOMAINS_COLUMNS.domain],
        counter: result[DOMAINS_COLUMNS.counter],
        disabled: result[DOMAINS_COLUMNS.disabled],
        timer: result[DOMAINS_COLUMNS.timer],
      }
      response.status(200).send(resultResponse)
    } else {
      response.status(500).send({ message: 'Cannot get status' })
    }
  }
}
