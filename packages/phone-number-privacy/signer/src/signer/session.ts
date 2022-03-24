import { OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'express'

export class Session<R extends OdisRequest> {
  public timedOut: boolean
  readonly logger: Logger
  readonly controller: AbortController

  public constructor(
    readonly request: Request<{}, {}, R>,
    readonly response: Response<OdisResponse<R>>
  ) {
    this.logger = response.locals.logger()
    this.controller = new AbortController()
    this.timedOut = false
  }
}
