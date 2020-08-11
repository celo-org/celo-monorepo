import { AttestationServiceTestRequest } from '@celo/utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import express from 'express'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
import { rootLogger } from '../logger'
import { ErrorMessages, respondWithError } from '../request'
import { startSendSms } from '../sms'

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

  try {
    const provider = await startSendSms(testRequest.phoneNumber, testRequest.message)
    res.json({ success: true, provider }).status(201)
  } catch (error) {
    rootLogger.error(error)
    res.json({ success: false, error: error.message }).status(500)
  }
}
