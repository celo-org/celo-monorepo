import {
  ErrorType,
  FailureResponse,
  OdisRequest,
  OdisResponse,
  SuccessResponse,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Session } from './action.interface'

export interface IIOService<R extends OdisRequest> {
  init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R> | null>
  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, R>
  authenticate(request: Request<{}, {}, R>, logger: Logger): Promise<boolean>
  sendFailure(
    error: ErrorType,
    status: number,
    response: Response<FailureResponse<R>>,
    ...args: unknown[]
  ): void
  sendSuccess(status: number, response: Response<SuccessResponse<R>>, ...args: unknown[]): void
}
