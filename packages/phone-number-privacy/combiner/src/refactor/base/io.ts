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
import * as t from 'io-ts'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { OdisConfig } from '../../config'
import { Session } from '../session'
import { Signer } from './combine'

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
  status: number
}

export abstract class IO<R extends OdisRequest> {
  abstract readonly endpoint: CombinerEndpoint
  abstract readonly signerEndpoint: SignerEndpoint

  constructor(
    readonly config: OdisConfig,
    readonly requestSchema: t.Type<R, R, unknown>,
    readonly responseSchema: t.Type<OdisResponse<R>, OdisResponse<R>, unknown>
  ) {}

  abstract init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R> | null>

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

  validateClientRequest(request: Request<{}, {}, unknown>): request is Request<{}, {}, R> {
    return this.requestSchema.is(request.body)
  }

  validateSignerResponse(data: string, url: string, session: Session<R>): OdisResponse<R> {
    const res: unknown = JSON.parse(data)
    if (!this.responseSchema.is(res)) {
      session.logger.error(
        { data, signer: url },
        `Signer request to ${url + this.signerEndpoint} returned malformed response`
      )
      throw new Error(ErrorMessage.INVALID_SIGNER_RESPONSE)
    }
    return res
  }

  // DO NOT MERGE: Differentiate between receiving an invalid key version and no key version.
  // (follow pattern used in signer)
  getRequestKeyVersion(request: Request<{}, {}, R>, logger: Logger): number | undefined {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    const requestedKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(requestedKeyVersion)) {
      logger.warn({ keyVersionHeader }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
      return undefined
    }
    logger.info({ requestedKeyVersion }, 'Client request has valid key version')
    return requestedKeyVersion
  }

  getResponseKeyVersion(response: FetchResponse, logger: Logger): number | undefined {
    const keyVersionHeader = response.headers.get(KEY_VERSION_HEADER)
    const responseKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(responseKeyVersion)) {
      logger.warn({ keyVersionHeader }, ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
      return undefined
    }
    logger.info({ responseKeyVersion }, 'Signer response has valid key version')
    return responseKeyVersion
  }

  async fetchSignerResponseWithFallback(
    signer: Signer,
    session: Session<R>
  ): Promise<FetchResponse> {
    // TODO: Factor out this metering code
    const start = `Start ${signer.url + this.signerEndpoint}`
    const end = `End ${signer.url + this.signerEndpoint}`
    performance.mark(start)

    return this.fetchSignerResponse(signer.url, session)
      .catch((err) => {
        session.logger.error({ url: signer.url, error: err }, `Signer failed with primary url`)
        if (signer.fallbackUrl) {
          session.logger.warn({ url: signer.fallbackUrl }, `Using fallback url to call signer`)
          return this.fetchSignerResponse(signer.fallbackUrl, session)
        }
        throw err
      })
      .finally(() => {
        performance.mark(end)
        performance.measure(signer.url, start, end)
      })
  }

  protected async fetchSignerResponse(
    signerUrl: string,
    session: Session<R>
  ): Promise<FetchResponse> {
    const { request, logger, controller } = session
    const url = signerUrl + this.signerEndpoint
    logger.debug({ url }, `Sending signer request`)
    // prettier-ignore
    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // Pnp requests provide authorization in the request header
        ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
        [KEY_VERSION_HEADER]: 
        // Forward requested keyVersion if provided by client,
        // otherwise use default keyVersion.
        // This will be ignored for non-signing requests.
        (this.getRequestKeyVersion(request, logger) ?? this.config.keys.version).toString(),
      },
      body: JSON.stringify(request.body),
      signal: controller.signal,
    })
  }

  protected inputChecks(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): request is Request<{}, {}, R> {
    if (!this.config.enabled) {
      this.sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
      return false
    }
    if (!this.validateClientRequest(request)) {
      this.sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return false
    }
    return true
  }
}
