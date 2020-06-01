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
import config from '../config'

const PARTIAL_SIGN_MESSAGE_ENDPOINT = '/getBlindedSalt'
export interface SignMessageResponse {
  success: boolean
  signature: string
}

export async function handleGetDistributedBlindedMessageForSalt(
  request: Request,
  response: Response
) {
  if (!isValidGetSignatureInput(request.body)) {
    respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
    return
  }
  if (!authenticateUser(request)) {
    respondWithError(response, 401, ErrorMessages.UNAUTHENTICATED_USER)
    return
  }
  const signatures: ServicePartialSignature[] = []
  for (const service of config.pgpnpServices) {
    const res = await fetch(service.url + PARTIAL_SIGN_MESSAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: request.headers.authorization!,
      },
      body: JSON.stringify(request.body),
    })

    // if res no ok, then it will not be added to the list of signatures
    if (res.ok) {
      const signResponse = (await res.json()) as SignMessageResponse
      signatures.push({ url: service.url, signature: signResponse.signature })
    }
  }
  try {
    const combinedSignature = await BLSCryptographyClient.combinePartialBlindedSignatures(
      signatures,
      request.body.blindedQueryPhoneNumber
    )
    response.json({ success: true, combinedSignature })
  } catch (e) {
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

function isValidGetSignatureInput(requestBody: any): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody) &&
    phoneNumberHashIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}
