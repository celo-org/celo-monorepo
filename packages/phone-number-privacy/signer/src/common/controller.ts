import { ErrorMessage, OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Action } from './action'
import { Counters, Histograms, meter } from './metrics'

export class Controller<R extends OdisRequest> {
  constructor(readonly action: Action<R>) {}

  public async handle(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<void> {
    Counters.requests.labels(this.action.io.endpoint).inc()
    // Unique error to be thrown on timeout
    const timeoutError = Symbol()
    await meter(
      async () => {
        const session = await this.action.io.init(request, response)
        // Init returns a response to the user internally.
        if (session) {
          await this.action.perform(session, timeoutError)
        }
      },
      [],
      (err: any) => {
        response.locals.logger.error({ err }, `Error in handler for ${this.action.io.endpoint}`)
        let errMsg: any
        switch (err) {
          case timeoutError: {
            Counters.timeouts.inc()
            errMsg = ErrorMessage.TIMEOUT_FROM_SIGNER
            break
          }
          case ErrorMessage.DATABASE_GET_FAILURE:
          case ErrorMessage.DATABASE_INSERT_FAILURE:
          case ErrorMessage.DATABASE_UPDATE_FAILURE:
            errMsg = err
            break
          default:
            errMsg = ErrorMessage.UNKNOWN_ERROR
            break
        }
        this.action.io.sendFailure(errMsg, 500, response)
      },
      Histograms.responseLatency,
      [this.action.io.endpoint]
    )
  }
}
