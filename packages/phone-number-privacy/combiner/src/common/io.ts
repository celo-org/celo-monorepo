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
import { performance } from 'perf_hooks'
import { OdisConfig } from '../config'
import { Signer } from './combine'
import { Session } from './session'

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
  status: number
}

export abstract class IO<R extends OdisRequest> {
  abstract readonly endpoint: CombinerEndpoint
  abstract readonly signerEndpoint: SignerEndpoint
  abstract readonly requestSchema: t.Type<R, R, unknown>
  abstract readonly responseSchema: t.Type<OdisResponse<R>, OdisResponse<R>, unknown>

  constructor(readonly config: OdisConfig) {}

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

  // TODO(Alec): why is session sometimes passed in and logger other times?
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

  responseHasValidKeyVersion(response: FetchResponse, session: Session<R>): boolean {
    const responseKeyVersion = this.getResponseKeyVersion(response, session.logger)
    const requestKeyVersion =
      this.getRequestKeyVersion(session.request, session.logger) ?? this.config.keys.version

    const isValid = responseKeyVersion === requestKeyVersion
    if (!isValid) {
      session.logger.error(
        { requestKeyVersion, responseKeyVersion },
        ErrorMessage.INVALID_KEY_VERSION_RESPONSE
      )
    }

    return isValid
  }

  getResponseKeyVersion(response: FetchResponse, logger: Logger): number | undefined {
    const keyVersionHeader = response.headers.get(KEY_VERSION_HEADER)
    if (keyVersionHeader === undefined) {
      return undefined
    }

    const responseKeyVersion = Number(keyVersionHeader)

    if (!Number.isInteger(responseKeyVersion)) {
      logger.error({ keyVersionHeader }, ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
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
    const { request, logger, abort } = session
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
      signal: abort.signal,
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
