import {
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  getRequestKeyVersion,
  getSignerEndpoint,
  KeyVersionInfo,
  KEY_VERSION_HEADER,
  OdisRequest,
  OdisResponse,
  requestHasValidKeyVersion,
  send,
  SignerEndpoint,
  SuccessResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import * as t from 'io-ts'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { performance } from 'perf_hooks'
import { getCombinerVersion, OdisConfig } from '../config'
import { Signer } from './combine'
import { Session } from './session'

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
  status: number
}

export abstract class IO<R extends OdisRequest> {
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)
  abstract readonly requestSchema: t.Type<R, R, unknown>
  abstract readonly responseSchema: t.Type<OdisResponse<R>, OdisResponse<R>, unknown>

  constructor(readonly config: OdisConfig, readonly endpoint: CombinerEndpoint) {}

  abstract init(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): Promise<Session<R> | null>

  abstract authenticate(request: Request<{}, {}, R>, logger?: Logger): Promise<boolean>

  abstract sendSuccess(
    status: number,
    response: Response<SuccessResponse<R>>,
    ...args: unknown[]
  ): void

  validateClientRequest(request: Request<{}, {}, unknown>): request is Request<{}, {}, R> {
    return this.requestSchema.is(request.body)
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

  protected inputChecks(
    request: Request<{}, {}, unknown>,
    response: Response<OdisResponse<R>>
  ): request is Request<{}, {}, R> {
    if (!this.config.enabled) {
      sendFailure(WarningMessage.API_UNAVAILABLE, 503, response)
      return false
    }
    if (!this.validateClientRequest(request)) {
      sendFailure(WarningMessage.INVALID_INPUT, 400, response)
      return false
    }
    return true
  }
}

export function requestHasSupportedKeyVersion(
  request: Request<{}, {}, OdisRequest>,
  config: OdisConfig,
  logger: Logger
): boolean {
  try {
    getKeyVersionInfo(request, config, logger)
    return true
  } catch (err) {
    logger.debug('Error caught in requestHasSupportedKeyVersion')
    logger.debug(err)
    return false
  }
}

export function getKeyVersionInfo(
  request: Request<{}, {}, OdisRequest>,
  config: OdisConfig,
  logger: Logger
): KeyVersionInfo {
  // If an invalid key version is present, we don't want this function to throw but
  // to instead replace the key version with the default
  // If a valid but unsupported key version is present, we want this function to throw
  let requestKeyVersion: number | undefined
  if (requestHasValidKeyVersion(request, logger)) {
    requestKeyVersion = getRequestKeyVersion(request, logger)
  }
  const keyVersion = requestKeyVersion ?? config.keys.currentVersion
  const supportedVersions: KeyVersionInfo[] = JSON.parse(config.keys.versions) // TODO add io-ts checks for this and signer array
  const filteredSupportedVersions: KeyVersionInfo[] = supportedVersions.filter(
    (v) => v.keyVersion === keyVersion
  )
  if (!filteredSupportedVersions.length) {
    throw new Error(`key version ${keyVersion} not supported`)
  }
  return filteredSupportedVersions[0]
}

export async function fetchSignerResponseWithFallback<R extends OdisRequest>(
  signer: Signer,
  signerEndpoint: string,
  session: Session<R>
): Promise<FetchResponse> {
  const { request, abort } = session

  async function fetchSignerResponse(url: string): Promise<FetchResponse> {
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

  return measureTime(signer.url + signerEndpoint, () =>
    fetchSignerResponse(signer.url + signerEndpoint).catch((err) => {
      session.logger.error({ url: signer.url, error: err }, `Signer failed with primary url`)
      if (signer.fallbackUrl) {
        session.logger.warn({ url: signer.fallbackUrl }, `Using fallback url to call signer`)
        return fetchSignerResponse(signer.fallbackUrl + signerEndpoint)
      } else {
        throw err
      }
    })
  )
}
async function measureTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = `Start ${name}`
  const end = `End ${name}`
  performance.mark(start)
  try {
    const res = await fn()
    return res
  } finally {
    performance.mark(end)
    performance.measure(name, start, end)
  }
}

export function sendFailure(error: ErrorType, status: number, response: Response<any>) {
  send(
    response,
    {
      success: false,
      version: getCombinerVersion(),
      error,
    },
    status,
    response.locals.logger
  )
}
