import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { attestToIdentifier, SignatureUtils } from '@celo/utils'
import { Address, isValidPrivateKey, toChecksumAddress } from '@celo/utils/lib/address'
import { AddressType, E164Number, E164PhoneNumberType } from '@celo/utils/lib/io'
import { isValidAddress } from 'ethereumjs-util'
import express from 'express'
import * as t from 'io-ts'
import { Transaction } from 'sequelize'
import { existingAttestationRequestRecord, getAttestationTable, kit, sequelize } from '../db'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { respondWithError } from '../request'
import { smsProviderFor } from '../sms'
import { SmsProviderType } from '../sms/base'

const SMS_SENDING_ERROR = 'Something went wrong while attempting to send SMS, try again later'
const ATTESTATION_ERROR = 'Valid attestation could not be provided'
const NO_INCOMPLETE_ATTESTATION_FOUND_ERROR = 'No incomplete attestation found'
const ATTESTATION_ALREADY_SENT_ERROR = 'Attestation already sent'
const COUNTRY_CODE_NOT_SERVED_ERROR = 'Your country code is not being served by this service'

export const AttestationRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
})

export type AttestationRequest = t.TypeOf<typeof AttestationRequestType>

export function getAttestationKey() {
  if (
    process.env.ATTESTATION_KEY === undefined ||
    !isValidPrivateKey(process.env.ATTESTATION_KEY)
  ) {
    console.error('Did not specify valid ATTESTATION_KEY')
    throw new Error('Did not specify valid ATTESTATION_KEY')
  }

  return process.env.ATTESTATION_KEY
}

export function getAccountAddress() {
  if (process.env.ACCOUNT_ADDRESS === undefined || !isValidAddress(process.env.ACCOUNT_ADDRESS)) {
    console.error('Did not specify valid ACCOUNT_ADDRESS')
    throw new Error('Did not specify valid ACCOUNT_ADDRESS')
  }

  return toChecksumAddress(process.env.ACCOUNT_ADDRESS)
}

async function validateAttestationRequest(request: AttestationRequest) {
  const attestationRecord = await existingAttestationRequestRecord(
    request.phoneNumber,
    request.account,
    request.issuer
  )
  // check if it exists in the database
  if (attestationRecord && !attestationRecord.canSendSms()) {
    throw new Error(ATTESTATION_ALREADY_SENT_ERROR)
  }
  const address = getAccountAddress()

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
    throw new Error(NO_INCOMPLETE_ATTESTATION_FOUND_ERROR)
  }

  // TODO: Check expiration
  return
}

async function validateAttestation(
  attestationRequest: AttestationRequest,
  attestationCode: string
) {
  const address = getAccountAddress()
  const attestations = await kit.contracts.getAttestations()
  const isValid = await attestations.validateAttestationCode(
    attestationRequest.phoneNumber,
    attestationRequest.account,
    address,
    attestationCode
  )

  if (!isValid) {
    throw new Error(ATTESTATION_ERROR)
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

async function ensureLockedRecord(
  attestationRequest: AttestationRequest,
  transaction: Transaction
) {
  const AttestationTable = await getAttestationTable()
  await AttestationTable.findOrCreate({
    where: {
      phoneNumber: attestationRequest.phoneNumber,
      account: attestationRequest.account,
      issuer: attestationRequest.issuer,
    },
    defaults: {
      smsProvider: SmsProviderType.UNKNOWN,
      status: AttestationStatus.DISPATCHING,
    },
    transaction,
  })

  // Query to lock the record
  const attestationRecord = await existingAttestationRequestRecord(
    attestationRequest.phoneNumber,
    attestationRequest.account,
    attestationRequest.issuer,
    { transaction, lock: Transaction.LOCK.UPDATE }
  )

  if (!attestationRecord) {
    // This should never happen
    throw new Error(`Somehow we did not get an attestation record`)
  }

  if (!attestationRecord.canSendSms()) {
    // Another transaction has locked on the record before we did
    throw new Error(`Another process has already sent the sms`)
  }

  return attestationRecord
}

async function sendSmsAndPersistAttestation(
  attestationRequest: AttestationRequest,
  attestationCode: string
) {
  const textMessage = createAttestationTextMessage(attestationCode)
  let attestationRecord: AttestationModel | null = null

  const transaction = await sequelize!.transaction()

  try {
    attestationRecord = await ensureLockedRecord(attestationRequest, transaction)
    const provider = smsProviderFor(attestationRequest.phoneNumber)

    if (!provider) {
      await attestationRecord.update(
        { status: AttestationStatus.UNABLE_TO_SERVE, smsProvider: SmsProviderType.UNKNOWN },
        { transaction }
      )
      await transaction.commit()
      return attestationRecord
    }

    try {
      await provider.sendSms(attestationRequest.phoneNumber, textMessage)
      await attestationRecord.update(
        { status: AttestationStatus.SENT, smsProvider: provider.type },
        { transaction }
      )
    } catch (error) {
      console.error(error)
      await attestationRecord.update(
        { status: AttestationStatus.FAILED, smsProvider: provider.type },
        { transaction }
      )
    }

    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
  }

  return attestationRecord
}

function respondAfterSendingSms(res: express.Response, attestationRecord: AttestationModel | null) {
  if (!attestationRecord) {
    console.error('Attestation Record was not created')
    respondWithError(res, 500, SMS_SENDING_ERROR)
    return
  }

  switch (attestationRecord.status) {
    case AttestationStatus.SENT:
      res.status(201).json({ success: true })
      return
    case AttestationStatus.FAILED:
      respondWithError(res, 500, SMS_SENDING_ERROR)
      return
    case AttestationStatus.UNABLE_TO_SERVE:
      respondWithError(res, 422, COUNTRY_CODE_NOT_SERVED_ERROR)
    default:
      console.error(
        'Attestation Record should either be failed or sent, but was ',
        attestationRecord.status
      )
      respondWithError(res, 500, SMS_SENDING_ERROR)
      return
  }
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
    respondWithError(res, 422, error.toString())
    return
  }

  try {
    const attestationRecord = await sendSmsAndPersistAttestation(
      attestationRequest,
      attestationCode
    )
    respondAfterSendingSms(res, attestationRecord)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, SMS_SENDING_ERROR)
    return
  }
}
