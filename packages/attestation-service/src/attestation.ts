import { attestToIdentifier, SignatureUtils } from '@celo/utils'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import express from 'express'
import { sendSms } from './sms'
function signAttestation(phoneNumber: string, account: string) {
  if (process.env.ATTESTATION_KEY === undefined) {
    console.error('Did not specify ATTESTATION_KEY')
    throw new Error('Did not specify ATTESTATION_KEY')
  }

  const signature = attestToIdentifier(phoneNumber, account, process.env.ATTESTATION_KEY)

  return SignatureUtils.serializeSignature(signature)
}

function toBase64(str: string) {
  return Buffer.from(str, 'hex').toString('base64')
}

function createAttestationTextMessage(attestationCode: string) {
  return `<#> ${toBase64(attestationCode)} ${process.env.APP_SIGNATURE}`
}

export async function handleAttestationRequest(req: express.Request, res: express.Response) {
  // TODO: Should parse request appropriately

  // TODO: Should validate request here
  // const attestations = await kit.contracts.getAttestations()

  // Produce attestation
  const attestationCode = signAttestation(req.body.phoneNumber, req.body.account)
  const textMessage = createAttestationTextMessage(attestationCode)

  // Send the SMS
  await retryAsyncWithBackOff(sendSms, 10, [req.body.phoneNumber, textMessage], 1000)

  res.json({ success: true })
}
