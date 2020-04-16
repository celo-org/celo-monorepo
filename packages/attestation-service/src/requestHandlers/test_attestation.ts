import { AttestationServiceTestRequest } from '@celo/utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import express from 'express'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
import { ErrorMessages, respondWithError } from '../request'
import { smsProviderFor } from '../sms'
export { AttestationServiceTestRequestType } from '@celo/utils/lib/io'

export async function handleTestAttestationRequest(
  _req: express.Request,
  res: express.Response,
  testRequest: AttestationServiceTestRequest
) {
  const accountIsValid = verifySignature(
    testRequest.phoneNumber + testRequest.message,
    testRequest.signature,
    getAccountAddress()
  )

  if (!accountIsValid) {
    // Signature may be via attestation signer (for ReleaseGold specifically)
    const signerIsValid = verifySignature(
      testRequest.phoneNumber + testRequest.message,
      testRequest.signature,
      getAttestationSignerAddress()
    )
    if (!signerIsValid) {
      respondWithError(res, 422, ErrorMessages.INVALID_SIGNATURE)
      return
    }
  }

  const provider = smsProviderFor(testRequest.phoneNumber)
  if (provider === undefined) {
    respondWithError(res, 422, ErrorMessages.NO_PROVIDER_SETUP)
    return
  }

  await provider!.sendSms(testRequest.phoneNumber, testRequest.message)
  res.json({ success: true }).status(201)
}
