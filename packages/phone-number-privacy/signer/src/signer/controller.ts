import { ErrorMessage, OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import { Request, Response } from 'express'
import { Counters } from '../common/metrics'
import { Config } from '../config'
import { IActionService } from './action.interface'
import { IIOService } from './io.interface'
import { IQuotaService } from './quota.interface'

export class Controller<R extends OdisRequest> {
  constructor(
    readonly config: Config,
    readonly quota: IQuotaService<R>,
    readonly action: IActionService<R>,
    readonly io: IIOService<R>
  ) {}

  public async handle(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<void> {
    // TODO(Alec): move next line inside action
    Counters.requests.labels(this.action.endpoint).inc()
    try {
      const session = await this.io.init(request, response)
      if (session) {
        await this.action.perform(session)
      }
    } catch (err) {
      response.locals
        .logger()
        .error({ error: err }, `Unknown error in handler for ${this.action.endpoint}`)
      this.io.sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, response)
    }
  }
}
