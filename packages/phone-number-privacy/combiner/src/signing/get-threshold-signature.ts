import {
  authenticateUser,
  ErrorMessage,
  hasValidAccountParam,
  hasValidQueryPhoneNumberParam,
  hasValidTimestamp,
  isBodyReasonablySized,
  logger,
  MAX_BLOCK_DISCREPANCY_THRESHOLD,
  phoneNumberHashIsValidIfExists,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import { Request, Response } from 'firebase-functions'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { respondWithError } from '../common/error-utils'
import config, { VERSION } from '../config'
import { getContractKit } from '../web3/contracts'

// TODO change to /getBlindedMessagePartialSig when all signers are running 1.1.0
const PARTIAL_SIGN_MESSAGE_ENDPOINT = '/getBlindedSalt'

type SignerResponse = SignMessageResponseSuccess | SignMessageResponseFailure

interface GetBlindedMessageSigRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
  timestamp?: number
}

interface SignerService {
  url: string
}

interface SignMsgRespWithStatus {
  url: string
  signMessageResponse: SignMessageResponse
  status: number
}

export async function handleGetBlindedMessageSig(
  request: Request<{}, {}, GetBlindedMessageSigRequest>,
  response: Response
) {
  try {
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!(await authenticateUser(request, getContractKit()))) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }
    logger.debug('Requesting signatures')
    await requestSignatures(request, response)
  } catch (e) {
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR)
  }
}

async function requestSignatures(request: Request, response: Response) {
  const responses: SignMsgRespWithStatus[] = []
  const sentResult = { sent: false }
  const errorCodes: Map<number, number> = new Map()
  const blsCryptoClient = new BLSCryptographyClient()

  const signers = JSON.parse(config.odisServices.signers) as SignerService[]
  const signerReqs = signers.map((service) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, config.odisServices.timeoutMilliSeconds)

    return requestSignature(service, request, controller)
      .then(async (res: FetchResponse) => {
        logger.info({ signer: service, res }, 'received requestSignature response from signer')
        if (res.ok) {
          await handleSuccessResponse(
            res,
            res.status,
            response,
            sentResult,
            responses,
            service.url,
            blsCryptoClient,
            request.body.blindedQueryPhoneNumber
          )
        } else {
          errorCodes.set(res.status, (errorCodes.get(res.status) || 0) + 1)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          logger.error(ErrorMessage.TIMEOUT_FROM_SIGNER)
          logger.error({ err, signer: service })
        } else {
          logger.error(ErrorMessage.ERROR_REQUESTING_SIGNATURE)
          logger.error({ err, signer: service })
        }
      })
      .finally(() => {
        clearTimeout(timeout)
      })
  })

  await Promise.all(signerReqs)

  logResponseDiscrepancies(responses)
  const majorityErrorCode = getMajorityErrorCode(errorCodes)
  if (!blsCryptoClient.hasSufficientVerifiedSignatures()) {
    handleMissingSignatures(majorityErrorCode, response)
  }
}

async function handleSuccessResponse(
  res: FetchResponse,
  status: number,
  response: Response,
  sentResult: { sent: boolean },
  responses: SignMsgRespWithStatus[],
  serviceUrl: string,
  blsCryptoClient: BLSCryptographyClient,
  blindedQueryPhoneNumber: string
) {
  const signResponse = (await res.json()) as SignerResponse
  if (!signResponse.success) {
    // Continue on failure as long as signature is present to unblock user
    logger.info('Signer responded with error')
    logger.error({
      err: signResponse.error,
      signer: serviceUrl,
    })
  }
  if (!signResponse.signature) {
    throw new Error(`Signature is missing from signer ${serviceUrl}`)
  }
  responses.push({ url: serviceUrl, signMessageResponse: signResponse, status })
  const partialSig = { url: serviceUrl, signature: signResponse.signature }
  await blsCryptoClient.addSignature(partialSig, blindedQueryPhoneNumber)
  // Send response immediately once we cross threshold
  if (!sentResult.sent && blsCryptoClient.hasSufficientVerifiedSignatures()) {
    const combinedSignature = await blsCryptoClient.combinePartialBlindedSignatures()
    if (!sentResult.sent) {
      response.json({ success: true, combinedSignature, version: VERSION })
      sentResult.sent = true
    }
  }
}

function logResponseDiscrepancies(responses: SignMsgRespWithStatus[]) {
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
      logger.error({ values }, `Discrepancy found in signers' measured quota values`)
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
      logger.error(
        { values },
        `Discrepancy found in signers' latest block number that exceeds threshold`
      )
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
  controller: AbortController
): Promise<FetchResponse> {
  const url = service.url + PARTIAL_SIGN_MESSAGE_ENDPOINT
  logger.debug({ signer: url }, `Requesting partial sig`)
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

function getMajorityErrorCode(errorCodes: Map<number, number>) {
  if (errorCodes.size > 1) {
    logger.error({ errorCodes }, ErrorMessage.INCONSISTENT_SIGNER_RESPONSES)
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

function isValidGetSignatureInput(requestBody: GetBlindedMessageSigRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody) &&
    hasValidTimestamp(requestBody)
  )
}

function handleMissingSignatures(majorityErrorCode: number | null, response: Response) {
  if (majorityErrorCode === 403) {
    respondWithError(response, 403, WarningMessage.EXCEEDED_QUOTA)
  } else {
    respondWithError(response, majorityErrorCode || 500, ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES)
  }
}
