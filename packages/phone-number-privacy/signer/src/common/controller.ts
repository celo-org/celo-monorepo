import { ErrorMessage, OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Action } from './action'
import { Counters } from './metrics'

export class Controller<R extends OdisRequest> {
  constructor(readonly action: Action<R>) {}

  public async handle(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<void> {
    Counters.requests.labels(this.action.io.endpoint).inc()
    try {
      const session = await this.action.io.init(request, response)
      // Init returns a response to the user internally.
      if (session) {
        await this.action.perform(session)
      }
    } catch (err) {
      response.locals.logger.error(
        { error: err },
        `Unknown error in handler for ${this.action.io.endpoint}`
      )
      this.action.io.sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, response)
    }
  }
}
