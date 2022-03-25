import { OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'

export class Session<R extends OdisRequest> {
  // TODO(Alec): This can be deleted if no other state ends up being needed
  readonly logger: Logger

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>
  ) {
    this.logger = response.locals.logger()
  }
}
