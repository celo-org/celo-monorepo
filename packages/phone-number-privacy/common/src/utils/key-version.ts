import Logger from 'bunyan'
import { Request } from 'express'
import { Response as FetchResponse } from 'node-fetch'
import { ErrorMessage, KEY_VERSION_HEADER, OdisRequest, WarningMessage } from '..'

export interface KeyVersionInfo {
  keyVersion: number
  threshold: number
  polynomial: string
  pubKey: string
}

export function requestHasValidKeyVersion(
  request: Request<{}, {}, OdisRequest>,
  logger: Logger
): boolean {
  try {
    getRequestKeyVersion(request, logger)
    return true
  } catch (err) {
    logger.debug('Error caught in requestHasValidKeyVersion')
    logger.debug(err)
    return false
  }
}

export function getRequestKeyVersion(
  request: Request<{}, {}, OdisRequest>,
  logger: Logger
): number | undefined {
  const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
  const keyVersion = parseKeyVersionFromHeader(keyVersionHeader)

  if (keyVersion === undefined) {
    return undefined
  }
  if (!isValidKeyVersion(keyVersion)) {
    logger.error({ keyVersionHeader, keyVersion }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
    throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
  }

  logger.info({ keyVersion }, 'Request has valid key version')
  return keyVersion
}

export function responseHasExpectedKeyVersion(
  response: FetchResponse,
  expectedKeyVersion: number,
  logger: Logger
): boolean {
  let responseKeyVersion
  try {
    responseKeyVersion = getResponseKeyVersion(response, logger)
  } catch (err) {
    logger.debug('Error caught in responseHasExpectedKeyVersion')
    logger.debug(err)
    return false
  }

  if (responseKeyVersion !== expectedKeyVersion) {
    logger.error(
      { expectedKeyVersion, responseKeyVersion },
      ErrorMessage.INVALID_KEY_VERSION_RESPONSE
    )
    return false
  }

  return true
}

export function getResponseKeyVersion(response: FetchResponse, logger: Logger): number | undefined {
  const keyVersionHeader = response.headers.get(KEY_VERSION_HEADER)
  const keyVersion = parseKeyVersionFromHeader(keyVersionHeader)

  if (keyVersion === undefined) {
    return undefined
  }
  if (!isValidKeyVersion(keyVersion)) {
    logger.error({ keyVersionHeader, keyVersion }, ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
  }

  logger.info({ keyVersion }, 'Response has valid key version')
  return keyVersion
}

function parseKeyVersionFromHeader(
  keyVersionHeader: string | string[] | undefined | null
): number | undefined {
  if (keyVersionHeader === undefined || keyVersionHeader === null) {
    return undefined
  }

  const keyVersionHeaderString = keyVersionHeader.toString().trim()

  if (!keyVersionHeaderString.length || keyVersionHeaderString === 'undefined') {
    return undefined
  }

  return Number(keyVersionHeaderString)
}

function isValidKeyVersion(keyVersion: number): boolean {
  return Number.isInteger(keyVersion) && keyVersion >= 0
}
