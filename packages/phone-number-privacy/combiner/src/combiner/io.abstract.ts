import {
  CombinerEndpoint,
  ErrorMessage,
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
import { Response as FetchResponse } from 'node-fetch' // TODO(Alec): why are we using both express and node-fetch?
import { OdisConfig } from '../config'
import { DomainSignSession } from './domain/sign.session'
import { PnpSignSession } from './pnp/sign.session'
import { Session } from './session'
import { OdisSignatureRequest } from './sign.abstract'

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
  status: number
}

export abstract class IOAbstract<R extends OdisRequest> {
  abstract readonly endpoint: CombinerEndpoint
  abstract readonly signerEndpoint: SignerEndpoint

  constructor(readonly config: OdisConfig) {}

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

  abstract validateSignerResponse(data: string, url: string, session: Session<R>): OdisResponse<R>

  protected inputChecks(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): request is Request<{}, {}, R> {
    if (!this.config.enabled) {
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

// tslint:disable-next-line: max-classes-per-file
export abstract class SignIOAbstract<R extends OdisSignatureRequest> extends IOAbstract<R> {
  abstract init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<DomainSignSession | PnpSignSession | null> // TODO(Alec)

  // TODO(Alec): should forward user key version if possible
  getRequestKeyVersion(request: Request<{}, {}, R>, logger: Logger): number | undefined {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    logger.info({ keyVersionHeader })
    const requestedKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(requestedKeyVersion) || requestedKeyVersion !== this.config.keys.version) {
      // TODO(Alec)
      logger.warn({ keyVersionHeader }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
      return undefined
    }
    logger.info({ requestedKeyVersion }, 'Client request has valid key version')
    return requestedKeyVersion
  }

  getResponseKeyVersion(response: FetchResponse, logger: Logger): number | undefined {
    const keyVersionHeader = response.headers.get(KEY_VERSION_HEADER)
    const responseKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(responseKeyVersion) || responseKeyVersion !== this.config.keys.version) {
      // TODO(Alec)
      logger.warn({ keyVersionHeader }, ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
      return undefined
    }
    logger.info({ responseKeyVersion }, 'Signer response has valid key version')
    return responseKeyVersion
  }

  // protected inputChecks(
  //   request: Request<{}, {}, unknown>,
  //   response: Response<OdisResponse<R>>
  // ): request is Request<{}, {}, R> {
  //   if (!this.config.enabled) {
  //     this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
  //     return false
  //   }
  //   if (!this.validate(request)) {
  //     this.sendFailure(WarningMessage.INVALID_INPUT, 400, response)
  //     return false
  //   }
  //   return true
  // }
}
