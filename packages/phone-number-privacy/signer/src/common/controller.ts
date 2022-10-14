import {
  ErrorMessage,
  ErrorType,
  OdisRequest,
  OdisResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
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

        let errMsg: ErrorType = ErrorMessage.UNKNOWN_ERROR
        if (err === timeoutError) {
          Counters.timeouts.inc()
          errMsg = ErrorMessage.TIMEOUT_FROM_SIGNER
        } else if (
          err instanceof Error &&
          // Propagate standard error & warning messages thrown during endpoint handling
          (Object.values(ErrorMessage).includes(err.message as ErrorMessage) ||
            Object.values(WarningMessage).includes(err.message as WarningMessage))
        ) {
          errMsg = err.message as ErrorType
        }
        this.action.io.sendFailure(errMsg, 500, response)
      },
      Histograms.responseLatency,
      [this.action.io.endpoint]
    )
  }
}
