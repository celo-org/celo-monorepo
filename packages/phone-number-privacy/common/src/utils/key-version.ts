import Logger from 'bunyan'
import { Request } from 'express'
import { Response as FetchResponse } from 'node-fetch'
import { ErrorMessage, KEY_VERSION_HEADER, OdisRequest, WarningMessage } from '..'

export function requestHasValidKeyVersion(
  request: Request<{}, {}, OdisRequest>,
  logger: Logger
): boolean {
  try {
    getRequestKeyVersion(request, logger)
    return true
  } catch {
    return false
  }
}

export function getRequestKeyVersion(
  request: Request<{}, {}, OdisRequest>,
  logger: Logger
): number | undefined {
  const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
  if (keyVersionHeader === undefined) {
    return undefined
  }

  const keyVersionHeaderString = keyVersionHeader.toString() // could be string[]

  if (keyVersionHeaderString.trim().length === 0) {
    return undefined
  }

  const requestedKeyVersion = Number(keyVersionHeaderString)

  if (!Number.isInteger(requestedKeyVersion) || requestedKeyVersion < 0) {
    logger.error({ keyVersionHeader }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
    throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
  }
  return requestedKeyVersion
}

export function responseHasValidKeyVersion(
  request: Request<{}, {}, OdisRequest>,
  response: FetchResponse,
  defaultRequestKeyVersion: number,
  logger: Logger
): boolean {
  const responseKeyVersion = getResponseKeyVersion(response, logger)
  const requestKeyVersion = getRequestKeyVersion(request, logger) ?? defaultRequestKeyVersion

  const isValid = responseKeyVersion === requestKeyVersion
  if (!isValid) {
    logger.error(
      { requestKeyVersion, responseKeyVersion },
      ErrorMessage.INVALID_KEY_VERSION_RESPONSE
    )
  }

  return isValid
}

export function getResponseKeyVersion(response: FetchResponse, logger: Logger): number | undefined {
  const keyVersionHeader = response.headers.get(KEY_VERSION_HEADER)
  if (keyVersionHeader === null || keyVersionHeader.trim().length === 0) {
    return undefined
  }

  const responseKeyVersion = Number(keyVersionHeader)

  if (!Number.isInteger(responseKeyVersion) || responseKeyVersion < 0) {
    logger.error({ keyVersionHeader }, ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    return undefined
  }
  logger.info({ responseKeyVersion }, 'Response has valid key version')
  return responseKeyVersion
}
