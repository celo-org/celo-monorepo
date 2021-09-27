import { DisableDomainRequestBody } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as core from 'express-serve-static-core'
import { getDomain, setDomainDisabled } from '../database/wrappers/domain'
import { IDomainService } from './domain.interface'

export class DomainService implements IDomainService {
  constructor(private logger: Logger) {}

  public async handleDisableDomain(
    request: Request<core.ParamsDictionary, {}, DisableDomainRequestBody>,
    response: Response
  ): Promise<void> {
    const result = await setDomainDisabled(request.params.domain, true, this.logger)

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
    const result = await getDomain(request.params.domain, this.logger)

    if (result) {
      response.sendStatus(200)
    } else {
      response.status(500).send({ message: 'Cannot get status' })
    }
  }
}
