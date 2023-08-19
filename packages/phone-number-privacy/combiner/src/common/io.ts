import {
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  FailureResponse,
  getRequestKeyVersion,
  KEY_VERSION_HEADER,
  KeyVersionInfo,
  OdisRequest,
  OdisResponse,
  requestHasValidKeyVersion,
  SignerEndpoint,
  SuccessResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import { Knex } from 'knex'
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

  constructor(readonly config: OdisConfig, readonly db?: Knex) {}

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

  getKeyVersionInfo(request: Request<{}, {}, OdisRequest>, logger: Logger): KeyVersionInfo {
    // If an invalid key version is present, we don't want this function to throw but
    // to instead replace the key version with the default
    // If a valid but unsupported key version is present, we want this function to throw
    let requestKeyVersion: number | undefined
    if (requestHasValidKeyVersion(request, logger)) {
      requestKeyVersion = getRequestKeyVersion(request, logger)
    }
    const keyVersion = requestKeyVersion ?? this.config.keys.currentVersion
    const supportedVersions: KeyVersionInfo[] = JSON.parse(this.config.keys.versions) // TODO add io-ts checks for this and signer array
    const filteredSupportedVersions: KeyVersionInfo[] = supportedVersions.filter(
      (v) => v.keyVersion === keyVersion
    )
    if (!filteredSupportedVersions.length) {
      throw new Error(`key version ${keyVersion} not supported`)
    }
    return filteredSupportedVersions[0]
  }

  requestHasSupportedKeyVersion(request: Request<{}, {}, OdisRequest>, logger: Logger): boolean {
    try {
      this.getKeyVersionInfo(request, logger)
      return true
    } catch (err) {
      logger.debug('Error caught in requestHasSupportedKeyVersion')
      logger.debug(err)
      return false
    }
  }

  validateSignerResponse(data: string, url: string, logger: Logger): OdisResponse<R> {
    const res: unknown = JSON.parse(data)
    if (!this.responseSchema.is(res)) {
      logger.error(
        { data, signer: url },
        `Signer request to ${url + this.signerEndpoint} returned malformed response`
      )
      throw new Error(ErrorMessage.INVALID_SIGNER_RESPONSE)
    }
    return res
  }

  async fetchSignerResponseWithFallback(
    signer: Signer,
    session: Session<R>
  ): Promise<FetchResponse> {
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
        // Forward requested keyVersion if provided by client, otherwise use default keyVersion.
        // This will be ignored for non-signing requests.
        [KEY_VERSION_HEADER]: session.keyVersionInfo.keyVersion.toString()
      },
      body: JSON.stringify(request.body),
      // @ts-ignore: missing property `reason`
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
