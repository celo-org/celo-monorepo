import { DisableDomainRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { setDomainDisabled } from '../database/wrappers/domain'
import { IDomainService } from './domain.interface'

export class DomainService implements IDomainService {
  constructor(private logger: Logger) {}

  public async handleDisableDomain(
    request: Request<{}, {}, DisableDomainRequest>,
    response: Response
  ): Promise<void> {
    const result = await setDomainDisabled(request.body.domain, true, this.logger)

    if (result) {
      response.sendStatus(200)
    } else {
      response.status(500).send({ message: 'Cannot disable the domain' })
    }
  }
}
