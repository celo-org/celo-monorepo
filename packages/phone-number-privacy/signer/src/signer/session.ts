import { ErrorType, OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'

export class Session<R extends OdisRequest> {
  readonly logger: Logger
  readonly errors: ErrorType[]

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>
  ) {
    this.logger = response.locals.logger()
    this.errors = []
  }
}
