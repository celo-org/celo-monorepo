import { Request, Response } from 'firebase-functions'
import fetch from 'node-fetch'
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
import config, { PgpnpServices } from '../config'

const PARTIAL_SIGN_MESSAGE_ENDPOINT = '/getBlindedSalt'

interface GetBlindedMessageForSaltRequest {
  account: string
  blindedQueryPhoneNumber: string
  hashedPhoneNumber?: string
}

export interface SignMessageResponse {
  success: boolean
  signature: string
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
    const signatures: ServicePartialSignature[] = await requestSigners(request)
    const combinedSignature = await BLSCryptographyClient.combinePartialBlindedSignatures(
      signatures,
      request.body.blindedQueryPhoneNumber
    )
    response.json({ success: true, combinedSignature })
  } catch (e) {
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

async function requestSigners(request: Request) {
  const signatures: ServicePartialSignature[] = []
  const requestsForSigners = config.pgpnpServices.map((service) =>
    requestSigner(service, request)
      .then(async (res) => {
        if (res.ok) {
          const signResponse = (await res.json()) as SignMessageResponse
          signatures.push({ url: service.url, signature: signResponse.signature })
        }
      })
      .catch((e) => {
        logger.error(`${ErrorMessages.SIGNER_RETURN_ERROR} from signer ${service.url}`, e)
      })
  )

  await Promise.all(requestsForSigners)
  return signatures
}

function requestSigner(service: PgpnpServices, request: Request): Promise<any> {
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

function isValidGetSignatureInput(requestBody: GetBlindedMessageForSaltRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}
