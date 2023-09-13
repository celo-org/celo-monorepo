import {
  getRequestKeyVersion,
  KEY_VERSION_HEADER,
  KeyVersionInfo,
  OdisRequest,
  OdisResponse,
  requestHasValidKeyVersion,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request } from 'express'
import * as http from 'http'
import * as https from 'https'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { performance } from 'perf_hooks'
import { OdisConfig } from '../config'
import { isAbortError, Signer } from './combine'

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

// tslint:disable-next-line: interface-over-type-literal
export type SignerResponse<R extends OdisRequest> = {
  url: string
  res: OdisResponse<R>
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
  signerEndpoint: SignerEndpoint,
  keyVersion: number,
  request: Request<{}, {}, R>,
  logger: Logger,
  abortSignal: AbortSignal
): Promise<FetchResponse> {
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
        [KEY_VERSION_HEADER]: keyVersion.toString()
      },
      body: JSON.stringify(request.body),
      signal: abortSignal,
      agent: url.startsWith("https://") ? httpsAgent : httpAgent
    })
  }

  return measureTime(signer.url + signerEndpoint, () =>
    fetchSignerResponse(signer.url + signerEndpoint).catch((err) => {
      logger.error({ url: signer.url, error: err }, `Signer failed with primary url`)
      if (signer.fallbackUrl && !isAbortError(err)) {
        logger.warn({ signer }, `Using fallback url to call signer`)
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
