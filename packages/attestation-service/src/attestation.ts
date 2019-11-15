import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { attestToIdentifier, SignatureUtils } from '@celo/utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import { Address, AddressType, E164Number, E164PhoneNumberType } from '@celo/utils/lib/io'
import express from 'express'
import * as t from 'io-ts'
import { existingAttestationRequest, kit, persistAttestationRequest } from './db'
import { sendSms } from './sms'

export const AttestationRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
})

export type AttestationRequest = t.TypeOf<typeof AttestationRequestType>

function getAttestationKey() {
  if (process.env.ATTESTATION_KEY === undefined) {
    console.error('Did not specify ATTESTATION_KEY')
    throw new Error('Did not specify ATTESTATION_KEY')
  }

  return process.env.ATTESTATION_KEY
}

async function validateAttestationRequest(request: AttestationRequest) {
  // check if it exists in the database
  if (
    (await existingAttestationRequest(request.phoneNumber, request.account, request.issuer)) !==
    null
  ) {
    throw new Error('Attestation already sent')
  }
  const key = getAttestationKey()
  const address = privateKeyToAddress(key)

  // TODO: Check with the new Accounts.sol
  if (address.toLowerCase() !== request.issuer.toLowerCase()) {
    throw new Error(`Mismatching issuer, I am ${address}`)
  }

  const attestations = await kit.contracts.getAttestations()
  const state = await attestations.getAttestationState(
    request.phoneNumber,
    request.account,
    request.issuer
  )

  if (state.attestationState !== AttestationState.Incomplete) {
    throw new Error('No incomplete attestation found')
  }

  // TODO: Check expiration
  return
}

async function validateAttestation(
  attestationRequest: AttestationRequest,
  attestationCode: string
) {
  const attestations = await kit.contracts.getAttestations()
  const isValid = await attestations.validateAttestationCode(
    attestationRequest.phoneNumber,
    attestationRequest.account,
    attestationRequest.issuer,
    attestationCode
  )
  if (!isValid) {
    throw new Error('Valid attestation could not be provided')
  }
  return
}

function signAttestation(phoneNumber: E164Number, account: Address) {
  const signature = attestToIdentifier(phoneNumber, account, getAttestationKey())

  return SignatureUtils.serializeSignature(signature)
}

function toBase64(str: string) {
  return Buffer.from(str.slice(2), 'hex').toString('base64')
}

function createAttestationTextMessage(attestationCode: string) {
  return `<#> ${toBase64(attestationCode)} ${process.env.APP_SIGNATURE}`
}

export async function handleAttestationRequest(
  _req: express.Request,
  res: express.Response,
  attestationRequest: AttestationRequest
) {
  let attestationCode
  try {
    await validateAttestationRequest(attestationRequest)
    attestationCode = signAttestation(attestationRequest.phoneNumber, attestationRequest.account)
    await validateAttestation(attestationRequest, attestationCode)
  } catch (error) {
    console.error(error)
    res.status(422).json({ success: false, error: error.toString() })
    return
  }

  try {
    const textMessage = createAttestationTextMessage(attestationCode)
    await persistAttestationRequest(
      attestationRequest.phoneNumber,
      attestationRequest.account,
      attestationRequest.issuer
    )
    await retryAsyncWithBackOff(sendSms, 10, [attestationRequest.phoneNumber, textMessage], 1000)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Something went wrong while attempting to send SMS, try again later',
    })
    return
  }

  res.json({ success: true })
}
