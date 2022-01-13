import { SequentialDelayDomainOptions } from '@celo/identity/lib/odis/domains'
import {
  authenticateUser,
  CombinerEndpoints,
  DomainRestrictedSignatureRequest,
  ErrorMessage,
  GetBlindedMessageSigRequest,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  isKnownDomain,
  KEY_VERSION_HEADER,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  SequentialDelayDomain,
  SignerEndpoints,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  verifyDomainRestrictedSignatureRequestSignature,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import Logger from 'bunyan'
import { Request, Response } from 'firebase-functions'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { performance, PerformanceObserver } from 'perf_hooks'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { respondWithError } from '../common/error-utils'
import config, { VERSION } from '../config'
import { getContractKit } from '../web3/contracts'

type SignerResponse = SignMessageResponseSuccess | SignMessageResponseFailure

type CombinerSigEndpoint = CombinerEndpoints.GET_BLINDED_MESSAGE_SIG | CombinerEndpoints.DOMAIN_SIGN
type SignerSigEndpoint =
  | SignerEndpoints.GET_BLINDED_MESSAGE_PARTIAL_SIG
  | SignerEndpoints.DOMAIN_SIGN

interface SignerService {
  url: string
  fallbackUrl?: string
}

interface SignMsgRespWithStatus {
  url: string
  signMessageResponse: SignMessageResponse
  status: number
}

export async function handlePnpSigReq(request: Request, response: Response) {
  return handleGetBlindedMessageSig(request, response, CombinerEndpoints.GET_BLINDED_MESSAGE_SIG)
}

export async function handleDomainSigReq(request: Request, response: Response) {
  return handleGetBlindedMessageSig(request, response, CombinerEndpoints.DOMAIN_SIGN)
}

async function handleGetBlindedMessageSig(
  request: Request,
  response: Response,
  endpoint: CombinerSigEndpoint
) {
  const logger: Logger = response.locals.logger

  try {
    if (!isValidGetSignatureInput(request, endpoint)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT, logger)
      return
    }
    if (!(await authenticateSignatureRequest(request, endpoint, logger))) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER, logger)
      return
    }
    logger.debug('Requesting signatures')
    await requestSignatures(request, response, endpoint)
  } catch (err) {
    logger.error('Unknown error in handleGetBlindedMessageSig')
    logger.error(err)
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, logger)
  }
}

async function requestSignatures(
  request: Request,
  response: Response,
  endpoint: CombinerSigEndpoint
) {
  const responses: SignMsgRespWithStatus[] = []
  const failedRequests = new Set<string>()
  const errorCodes: Map<number, number> = new Map()
  const blsCryptoClient = new BLSCryptographyClient()

  const logger: Logger = response.locals.logger

  const obs = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0]
    logger.info({ latency: entry, signer: entry!.name }, 'Signer response latency measured')
  })
  obs.observe({ entryTypes: ['measure'], buffered: true })

  // Get standardized variable set regardless of request type (PNP / Domains)
  const {
    signers,
    signerEndpoint,
    timeoutMs,
    keyVersion,
    threshold,
    blindedMessage,
    pubKey,
    polynomial,
  } = standardizeRequestParams(request, endpoint)

  request.headers[KEY_VERSION_HEADER] = keyVersion.toString()

  let timedOut = false
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const signerReqs = signers.map((service) => {
    const startMark = `Begin requestSignature ${service.url}`
    const endMark = `End requestSignature ${service.url}`
    const entryName = service.url
    performance.mark(startMark)

    return requestSignature(service, request, controller, signerEndpoint, logger)
      .then(async (res: FetchResponse) => {
        const data = await res.text()
        logger.info(
          { signer: service, res: data, status: res.status },
          'received requestSignature response from signer'
        )
        if (res.ok) {
          await handleSuccessResponse(
            data,
            res.status,
            response,
            responses,
            service.url,
            blsCryptoClient,
            blindedMessage,
            controller,
            pubKey,
            polynomial,
            threshold,
            keyVersion
          )
        } else {
          handleFailedResponse(
            service,
            res.status,
            signers.length,
            failedRequests,
            response,
            controller,
            errorCodes,
            threshold
          )
        }
      })
      .catch((err) => {
        let status: number | undefined = 500
        if (err.name === 'AbortError') {
          if (timedOut) {
            status = 408
            logger.error({ signer: service }, ErrorMessage.TIMEOUT_FROM_SIGNER)
          } else {
            // Request was cancelled, assuming it would have been successful
            status = undefined
            logger.info({ signer: service }, WarningMessage.CANCELLED_REQUEST_TO_SIGNER)
          }
        } else {
          logger.error({ signer: service }, ErrorMessage.ERROR_REQUESTING_SIGNATURE)
        }
        logger.error(err)
        handleFailedResponse(
          service,
          status,
          signers.length,
          failedRequests,
          response,
          controller,
          errorCodes,
          threshold
        )
      })
      .finally(() => {
        performance.mark(endMark)
        performance.measure(entryName, startMark, endMark)
      })
  })

  await Promise.all(signerReqs)
  clearTimeout(timeout)
  performance.clearMarks()
  obs.disconnect()

  logResponseDiscrepancies(responses, logger)
  const majorityErrorCode = getMajorityErrorCode(errorCodes, logger)
  if (blsCryptoClient.hasSufficientSignatures(threshold)) {
    try {
      const combinedSignature = await blsCryptoClient.combinePartialBlindedSignatures(
        blindedMessage,
        pubKey,
        polynomial,
        threshold,
        logger
      )
      response.json({ success: true, combinedSignature, version: VERSION })
      return
    } catch {
      // May fail upon combining signatures if too many sigs are invalid
      // Fallback to handleMissingSignatures
    }
  }
  handleMissingSignatures(majorityErrorCode, response, logger)
}

async function handleSuccessResponse(
  data: string,
  status: number,
  response: Response,
  responses: SignMsgRespWithStatus[],
  serviceUrl: string,
  blsCryptoClient: BLSCryptographyClient,
  blindedMessage: string,
  controller: AbortController,
  pubKey: string,
  polynomial: string,
  threshold: number,
  expectedKeyVersion: number
) {
  const logger: Logger = response.locals.logger
  const keyVersion: number = Number(response.header(KEY_VERSION_HEADER))
  logger.info({ keyVersion }, 'Signer responded with key version')
  if (keyVersion !== expectedKeyVersion) {
    throw new Error(`Incorrect key version received from signer ${serviceUrl}`)
  }
  const signResponse = JSON.parse(data) as SignerResponse
  if (!signResponse.success) {
    // Continue on failure as long as signature is present to unblock user
    logger.error(
      {
        error: signResponse.error,
        signer: serviceUrl,
      },
      'Signer responded with error'
    )
  }
  if (!signResponse.signature) {
    throw new Error(`Signature is missing from signer ${serviceUrl}`)
  }
  responses.push({ url: serviceUrl, signMessageResponse: signResponse, status })
  const partialSig = { url: serviceUrl, signature: signResponse.signature }
  logger.info({ signer: serviceUrl }, 'Add signature')
  const signatureAdditionStart = Date.now()
  await blsCryptoClient.addSignature(partialSig)
  logger.info(
    {
      signer: serviceUrl,
      hasSufficientSignatures: blsCryptoClient.hasSufficientSignatures(threshold),
      additionLatency: Date.now() - signatureAdditionStart,
    },
    'Added signature'
  )
  // Send response immediately once we cross threshold
  // BLS threshold signatures can be combined without all partial signatures
  if (blsCryptoClient.hasSufficientSignatures(threshold)) {
    try {
      await blsCryptoClient.combinePartialBlindedSignatures(
        blindedMessage,
        pubKey,
        polynomial,
        threshold,
        logger
      )
      // Close outstanding requests
      controller.abort()
    } catch {
      // Already logged, continue to collect signatures
    }
  }
}

// Fail fast if a sufficient number of signatures cannot be collected
function handleFailedResponse(
  service: SignerService,
  status: number | undefined,
  signerCount: number,
  failedRequests: Set<string>,
  response: Response,
  controller: AbortController,
  errorCodes: Map<number, number>,
  threshold: number
) {
  if (status) {
    errorCodes.set(status, (errorCodes.get(status) || 0) + 1)
  }
  const logger: Logger = response.locals.logger
  // Tracking failed request count via signer url prevents
  // double counting the same failed request by mistake
  failedRequests.add(service.url)

  const shouldFailFast = signerCount - failedRequests.size < threshold
  logger.info(`Recieved failure from ${failedRequests.size}/${signerCount} signers.`)
  if (shouldFailFast) {
    logger.info('Not possible to reach a sufficient number of signatures. Failing fast.')
    controller.abort()
  }
}

function logResponseDiscrepancies(responses: SignMsgRespWithStatus[], logger: Logger) {
  // Only compare responses which have values for the quota fields
  const successfulResponses = responses.filter(
    (response) =>
      response.signMessageResponse &&
      response.signMessageResponse.performedQueryCount &&
      response.signMessageResponse.totalQuota &&
      response.signMessageResponse.blockNumber
  )

  if (successfulResponses.length === 0) {
    return
  }
  // Compare the first response to the rest of the responses
  const expectedQueryCount = successfulResponses[0].signMessageResponse.performedQueryCount
  const expectedTotalQuota = successfulResponses[0].signMessageResponse.totalQuota
  const expectedBlockNumber = successfulResponses[0].signMessageResponse.blockNumber!
  let discrepancyFound = false
  for (const resp of successfulResponses) {
    // Performed query count should never diverge; however the totalQuota may
    // diverge if the queried block number is different
    if (
      resp.signMessageResponse.performedQueryCount !== expectedQueryCount ||
      (resp.signMessageResponse.totalQuota !== expectedTotalQuota &&
        resp.signMessageResponse.blockNumber === expectedBlockNumber)
    ) {
      const values = successfulResponses.map((response) => {
        return {
          signer: response.url,
          performedQueryCount: response.signMessageResponse.performedQueryCount,
          totalQuota: response.signMessageResponse.totalQuota,
        }
      })
      logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS)
      discrepancyFound = true
    }
    if (
      Math.abs(resp.signMessageResponse.blockNumber! - expectedBlockNumber) >
      MAX_BLOCK_DISCREPANCY_THRESHOLD
    ) {
      const values = successfulResponses.map((response) => {
        return {
          signer: response.url,
          blockNumber: response.signMessageResponse.blockNumber,
        }
      })
      logger.error({ values }, WarningMessage.INCONSISTENT_SIGNER_BLOCK_NUMBERS)
      discrepancyFound = true
    }
    if (discrepancyFound) {
      return
    }
  }
}

function requestSignature(
  service: SignerService,
  request: Request,
  controller: AbortController,
  endpoint: SignerSigEndpoint,
  logger: Logger
): Promise<FetchResponse> {
  return parameterizedSignatureRequest(service.url, request, controller, endpoint, logger).catch(
    (e) => {
      logger.error(`Signer failed with primary url ${service.url}`, e)
      if (service.fallbackUrl) {
        logger.warn(`Using fallback url to call signer ${service.fallbackUrl!}`)
        return parameterizedSignatureRequest(
          service.fallbackUrl!,
          request,
          controller,
          endpoint,
          logger
        )
      }
      throw e
    }
  )
}

function parameterizedSignatureRequest(
  baseUrl: string,
  request: Request,
  controller: AbortController,
  endpoint: SignerSigEndpoint,
  logger: Logger
): Promise<FetchResponse> {
  logger.debug({ signer: baseUrl }, `Requesting partial sig`)
  const url = baseUrl + endpoint
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization!,
    },
    body: JSON.stringify(request.body),
    signal: controller.signal,
  })
}

function getMajorityErrorCode(errorCodes: Map<number, number>, logger: Logger) {
  // Ignore timeouts
  const ignoredErrorCodes = [408]
  const uniqueErrorCount = Array.from(errorCodes.keys()).filter(
    (status) => !ignoredErrorCodes.includes(status)
  ).length
  if (uniqueErrorCount > 1) {
    logger.error(
      { errorCodes: JSON.stringify([...errorCodes]) },
      ErrorMessage.INCONSISTENT_SIGNER_RESPONSES
    )
  }

  let maxErrorCode = -1
  let maxCount = -1
  errorCodes.forEach((count, errorCode) => {
    // This gives priority to the lower status codes in the event of a tie
    // because 400s are more helpful than 500s for user feedback
    if (count > maxCount || (count === maxCount && errorCode < maxErrorCode)) {
      maxCount = count
      maxErrorCode = errorCode
    }
  })
  return maxErrorCode > 0 ? maxErrorCode : null
}

function isDomainRestrictedSignatureRequest(
  _body: any,
  endpoint: CombinerSigEndpoint
): _body is DomainRestrictedSignatureRequest<SequentialDelayDomain, SequentialDelayDomainOptions> {
  return endpoint === CombinerEndpoints.DOMAIN_SIGN
}

function isPnpSignatureRequest(
  _body: any,
  endpoint: CombinerSigEndpoint
): _body is GetBlindedMessageSigRequest {
  return endpoint === CombinerEndpoints.GET_BLINDED_MESSAGE_SIG
}

function isValidGetSignatureInput(request: Request, endpoint: CombinerSigEndpoint): boolean {
  if (isPnpSignatureRequest(request.body, endpoint)) {
    return (
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }
  if (isDomainRestrictedSignatureRequest(request.body, endpoint)) {
    return isKnownDomain(request.body.domain)
  }

  throw new Error(`Implementation error. Signature endpoint ${endpoint} not recognized`)
}

async function authenticateSignatureRequest(
  request: Request,
  endpoint: CombinerSigEndpoint,
  logger: Logger
): Promise<boolean> {
  if (isPnpSignatureRequest(request.body, endpoint)) {
    return authenticateUser(request, getContractKit(), logger)
  }
  if (isDomainRestrictedSignatureRequest(request.body, endpoint)) {
    return verifyDomainRestrictedSignatureRequestSignature(request.body)
  }

  throw new Error(`Implementation error. Signature endpoint ${endpoint} not recognized`)
}

function standardizeRequestParams(
  request: Request,
  endpoint: CombinerSigEndpoint
): {
  signers: SignerService[]
  signerEndpoint: SignerSigEndpoint
  timeoutMs: number
  threshold: number
  blindedMessage: string
  keyVersion: number
  pubKey: string
  polynomial: string
} {
  if (isPnpSignatureRequest(request.body, endpoint)) {
    return {
      signers: JSON.parse(config.odisServices.phoneNumberPrivacy.signers),
      signerEndpoint: SignerEndpoints.GET_BLINDED_MESSAGE_PARTIAL_SIG,
      timeoutMs: config.odisServices.phoneNumberPrivacy.timeoutMilliSeconds,
      threshold: config.keys.phoneNumberPrivacy.threshold,
      blindedMessage: request.body.blindedQueryPhoneNumber,
      keyVersion: config.keys.phoneNumberPrivacy.version,
      pubKey: config.keys.phoneNumberPrivacy.pubKey,
      polynomial: config.keys.phoneNumberPrivacy.polynomial,
    }
  }
  if (isDomainRestrictedSignatureRequest(request.body, endpoint)) {
    return {
      signers: JSON.parse(config.odisServices.domains.signers),
      signerEndpoint: SignerEndpoints.DOMAIN_SIGN,
      timeoutMs: config.odisServices.domains.timeoutMilliSeconds,
      threshold: config.keys.domains.threshold,
      blindedMessage: request.body.blindedMessage,
      keyVersion: config.keys.domains.version,
      pubKey: config.keys.domains.pubKey,
      polynomial: config.keys.domains.polynomial,
    }
  }

  throw new Error(`Implementation error. Signature endpoint ${endpoint} not recognized`)
}

function handleMissingSignatures(
  majorityErrorCode: number | null,
  response: Response,
  logger: Logger
) {
  if (majorityErrorCode === 403) {
    respondWithError(response, 403, WarningMessage.EXCEEDED_QUOTA, logger)
  } else {
    respondWithError(
      response,
      majorityErrorCode || 500,
      ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
      logger
    )
  }
}
