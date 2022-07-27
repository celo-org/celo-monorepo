import {
  ErrorType,
  FailureResponse,
  KEY_VERSION_HEADER,
  OdisRequest,
  OdisResponse,
  SignerEndpoint,
  SuccessResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { Session } from './action'

export abstract class IO<R extends OdisRequest> {
  abstract readonly endpoint: SignerEndpoint

  constructor(readonly enabled: boolean) {}

  abstract init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R> | null>

  abstract validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, R>

  abstract authenticate(request: Request<{}, {}, R>, logger?: Logger): Promise<boolean>

  abstract sendFailure(
    error: ErrorType,
    status: number,
    response: Response<FailureResponse<R>>,
    ...args: unknown[]
  ): void

  abstract sendSuccess(
    status: number,
    response: Response<SuccessResponse<R>>,
    ...args: unknown[]
  ): void

  requestHasValidKeyVersion(request: Request<{}, {}, R>, logger: Logger): boolean {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    if (keyVersionHeader === undefined) {
      return true
    }

    const requestedKeyVersion = Number(keyVersionHeader)

    const isValid = Number.isInteger(requestedKeyVersion)
    if (!isValid) {
      logger.warn({ keyVersionHeader }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }
    return isValid
  }

  getRequestKeyVersion(request: Request<{}, {}, R>, logger: Logger): number | undefined {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    if (keyVersionHeader === undefined) {
      return undefined
    }

    const requestedKeyVersion = Number(keyVersionHeader)

    if (!Number.isInteger(requestedKeyVersion)) {
      logger.error({ keyVersionHeader }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
      throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }
    return requestedKeyVersion
  }

  protected inputChecks(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): request is Request<{}, {}, R> {
    if (!this.enabled) {
      this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
      return false
    }
    if (!this.validate(request)) {
      this.sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return false
    }
    return true
  }
}
