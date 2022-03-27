import {
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  FailureResponse,
  OdisRequest,
  OdisResponse,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Counters } from '../common/metrics'
import { Config } from '../config'
import { IQuotaService } from './quota.interface'
import { Session } from './session'

export abstract class Controller<R extends OdisRequest> {
  abstract readonly endpoint: SignerEndpoint
  abstract readonly combinerEndpoint: CombinerEndpoint

  constructor(readonly config: Config, readonly quotaService: IQuotaService<R>) {} // TODO(Alec): dep injection?

  public async handle(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<void> {
    Counters.requests.labels(this.endpoint).inc()
    const logger: Logger = response.locals.logger
    try {
      if (!this.config.api.domains.enabled) {
        return this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response, logger)
      }
      if (!this.validate(request)) {
        return this.sendFailure(WarningMessage.INVALID_INPUT, 400, response, logger)
      }
      if (!this.checkRequestKeyVersion(request, logger)) {
        return this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response, logger)
      }
      if (!(await this.authenticate(request, logger))) {
        return this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response, logger)
      }
      // TODO(Alec)
      const session = new Session<R>(request, response)
      await this._handle(session)
    } catch (err) {
      logger.error({ error: err }, `Unknown error in handler for ${this.endpoint}`)
      this.sendFailure(ErrorMessage.UNKNOWN_ERROR, 500, response, logger)
    }
  }

  protected abstract _handle(session: Session<R>): Promise<void>
  protected abstract validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, R>
  protected abstract checkRequestKeyVersion(request: Request<{}, {}, R>, logger: Logger): boolean
  protected abstract authenticate(request: Request<{}, {}, R>, logger: Logger): Promise<boolean>
  protected abstract sendFailure(
    error: ErrorType,
    status: number,
    response: Response<FailureResponse<R>>,
    logger: Logger,
    ...args: unknown[]
  ): void
}
