import { DomainRequest } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'

export class DomainSession<R extends DomainRequest> {
  readonly logger: Logger

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>
  ) {
    this.logger = response.locals.logger()
  }
}
