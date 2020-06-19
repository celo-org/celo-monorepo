
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
import config from '../config'

const PARTIAL_SIGN_MESSAGE_ENDPOINT = '/getBlindedSalt'

interface GetBlindedMessageForSaltRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
}

interface SignMessageResponse {
  success: boolean
  signature: string
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
    const { successCount, signatures, majorityErrorCode } = await requestSignatures(request)
    if (successCount >= config.thresholdSignature.threshold) {
      const combinedSignature = await BLSCryptographyClient.combinePartialBlindedSignatures(
        signatures,
        request.body.blindedQueryPhoneNumber
      )
      response.json({ success: true, combinedSignature })
    } else {
      handleMissingSignatures(majorityErrorCode, response)
    }
  } catch (e) {
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

async function requestSignatures(request: Request) {
  let successCount = 0
  const responses: SignMsgRespWithStatus[] = []
  const errorCodes: Map<number, number> = new Map()

  const signers = JSON.parse(config.pgpnpServices.signers) as SignerService[]
  const signerReqs = signers.map((service) =>
    requestSigatureWithTimeout(service, request)
      .then(async (res) => {
        console.log("**HIT2" + JSON.stringify(res as FetchResponse))
        if (res) {
          const fetchResponse = res as FetchResponse
          const status = fetchResponse.status
          if (fetchResponse.ok) {
            const signResponse = (await fetchResponse.json()) as SignMessageResponse
            responses.push({ url: service.url, signature: signResponse.signature, status })
            successCount += 1
          } else {
            responses.push({ url: service.url, status })
            errorCodes.set(status, (errorCodes.get(status) || 0) + 1)
          }
        } else {
          logger.error(`${ErrorMessages.TIMEOUT_FROM_SIGNER} from signer ${service.url}`)
        }
      })
      .catch((e) => {
        logger.error(`${ErrorMessages.SIGNER_RETURN_ERROR} from signer ${service.url}`, e)
        responses.push({ url: service.url, status: 500 })
      })
  )

  await Promise.all(signerReqs)

  const majorityErrorCode = getMajorityErrorCode(errorCodes, responses)

  const signatures: ServicePartialSignature[] = []
  // Using a for loop to make TS happy, it doesn't interpret map or filter well
  for (const resp of responses) {
    const { url, signature } = resp
    if (signature) {
      signatures.push({ url, signature })
    }
  }

  return { successCount, signatures, majorityErrorCode }
}

function requestSigatureWithTimeout(
  service: SignerService,
  request: Request
): Promise<FetchResponse | boolean> {
  return Promise.race([requestSigature(service, request), abort()])
}

async function abort(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(false)
    }, config.pgpnpServices.timeoutMilliSeconds)
  })
}

function requestSigature(service: SignerService, request: Request): Promise<FetchResponse> {
  return fetch(service.url + PARTIAL_SIGN_MESSAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: request.headers.authorization!,
    },
    body: JSON.stringify(request.body),
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
