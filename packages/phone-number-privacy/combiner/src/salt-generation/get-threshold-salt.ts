import AbortController from 'abort-controller'
import { Request, Response } from 'firebase-functions'
import fetch, { Response as FetchResponse } from 'node-fetch'
import { BLSCryptographyClient, ServicePartialSignature } from '../bls/bls-cryptography-client'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import {
  hasValidAccountParam,
  hasValidQueryPhoneNumberParam,
  isBodyReasonablySized,
  phoneNumberHashIsValidIfExists,
} from '../common/input-validation'
import logger from '../common/logger'
import config, { VERSION } from '../config'

const PARTIAL_SIGN_MESSAGE_ENDPOINT = '/getBlindedSalt'

interface GetBlindedMessageForSaltRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
}

interface SignMessageResponse {
  success: boolean
  signature: string
  version: string
}

interface SignerService {
  url: string
}

interface SignMsgRespWithStatus {
  url: string
  signature?: string
  status: number
}

export async function handleGetDistributedBlindedMessageForSalt(
  request: Request<{}, {}, GetBlindedMessageForSaltRequest>,
  response: Response
) {
  try {
    if (!isValidGetSignatureInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    if (!authenticateUser(request)) {
      respondWithError(response, 401, ErrorMessages.UNAUTHENTICATED_USER)
      return
    }
    const { successCount, majorityErrorCode } = await requestSignatures(request, response)
    if (successCount < config.thresholdSignature.threshold) {
      handleMissingSignatures(majorityErrorCode, response)
    }
  } catch (e) {
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

async function requestSignatures(request: Request, response: Response) {
  let successCount = 0
  const responses: SignMsgRespWithStatus[] = []
  const signatures: ServicePartialSignature[] = []
  const errorCodes: Map<number, number> = new Map()

  const signers = JSON.parse(config.pgpnpServices.signers) as SignerService[]
  const signerReqs = signers.map((service) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, config.pgpnpServices.timeoutMilliSeconds)
    let sentResult: boolean = false

    return requestSignature(service, request, controller)
      .then(async (res: FetchResponse) => {
        const status = res.status
        if (res.ok) {
          const signResponse = (await res.json()) as SignMessageResponse
          responses.push({ url: service.url, signature: signResponse.signature, status })
          signatures.push({ url: service.url, signature: signResponse.signature })
          successCount += 1
          // Send response immediately once we cross threshold
          if (!sentResult && successCount >= config.thresholdSignature.threshold) {
            sentResult = true
            const combinedSignature = await BLSCryptographyClient.combinePartialBlindedSignatures(
              signatures,
              request.body.blindedQueryPhoneNumber
            )
            response.json({ success: true, combinedSignature, version: VERSION })
          }
        } else {
          responses.push({ url: service.url, status })
          errorCodes.set(status, (errorCodes.get(status) || 0) + 1)
        }
      })
      .catch((e) => {
        if (e.name === 'AbortError') {
          logger.error(`${ErrorMessages.TIMEOUT_FROM_SIGNER} from signer ${service.url}`)
        } else {
          logger.error(`${ErrorMessages.SIGNER_RETURN_ERROR} from signer ${service.url}`, e)
          responses.push({ url: service.url, status: 500 })
        }
      })
      .finally(() => {
        clearTimeout(timeout)
      })
  })

  await Promise.all(signerReqs)

  const majorityErrorCode = getMajorityErrorCode(errorCodes, responses)

  return { successCount, majorityErrorCode }
}

function requestSignature(
  service: SignerService,
  request: Request,
  controller: AbortController
): Promise<FetchResponse> {
  return fetch(service.url + PARTIAL_SIGN_MESSAGE_ENDPOINT, {
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

function getMajorityErrorCode(errorCodes: Map<number, number>, responses: SignMsgRespWithStatus[]) {
  if (errorCodes.size > 1) {
    logger.error(ErrorMessages.INCONSISTENT_SINGER_RESPONSES)
    responses.forEach((resp) => {
      logger.error(`${resp.url} returned ${resp.status}`)
    })
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

function isValidGetSignatureInput(requestBody: GetBlindedMessageForSaltRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}

function handleMissingSignatures(majorityErrorCode: number | null, response: Response) {
  if (majorityErrorCode === 403) {
    respondWithError(response, 403, ErrorMessages.EXCEEDED_QUOTA)
  } else {
    respondWithError(
      response,
      majorityErrorCode || 500,
      ErrorMessages.NOT_ENOUGH_PARTIAL_SIGNATURES
    )
  }
}
