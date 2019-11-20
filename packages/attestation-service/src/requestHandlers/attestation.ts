import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { attestToIdentifier, SignatureUtils } from '@celo/utils'
import { isValidPrivateKey, toChecksumAddress } from '@celo/utils/lib/address'
import { AddressType, E164PhoneNumberType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import { isValidAddress } from 'ethereumjs-util'
import express from 'express'
import * as t from 'io-ts'
import { Transaction } from 'sequelize'
import { existingAttestationRequestRecord, getAttestationTable, kit, sequelize } from '../db'
import { Counters } from '../metrics'
import { AttestationModel, AttestationStatus } from '../models/attestation'
import { respondWithError, Response } from '../request'
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

class AttestationRequestHandler {
  logger: Logger
  sequelizeLogger: (_msg: string, sequelizeLog: any) => void
  constructor(public readonly attestationRequest: AttestationRequest, logger: Logger) {
    this.logger = logger.child({ attestationRequest })
    this.sequelizeLogger = (msg: string, sequelizeLogArgs: any) =>
      this.logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)
  }

  async validateAttestationRequest() {
    const attestationRecord = await existingAttestationRequestRecord(
      this.attestationRequest.phoneNumber,
      this.attestationRequest.account,
      this.attestationRequest.issuer,
      { logging: this.sequelizeLogger }
    )
    // check if it exists in the database
    if (attestationRecord && !attestationRecord.canSendSms()) {
      Counters.attestationRequestsAlreadySent.inc()
      throw new Error(ATTESTATION_ALREADY_SENT_ERROR)
    }
    const address = getAccountAddress()

    // TODO: Check with the new Accounts.sol
    if (address.toLowerCase() !== this.attestationRequest.issuer.toLowerCase()) {
      Counters.attestationRequestsWrongIssuer.inc()
      throw new Error(`Mismatching issuer, I am ${address}`)
    }

    const attestations = await kit.contracts.getAttestations()
    const state = await attestations.getAttestationState(
      this.attestationRequest.phoneNumber,
      this.attestationRequest.account,
      this.attestationRequest.issuer
    )

    if (state.attestationState !== AttestationState.Incomplete) {
      Counters.attestationRequestsWOIncompleteAttestation.inc()
      throw new Error(NO_INCOMPLETE_ATTESTATION_FOUND_ERROR)
    }

    // TODO: Check expiration
    return
  }

  signAttestation() {
    const signature = attestToIdentifier(
      this.attestationRequest.phoneNumber,
      this.attestationRequest.account,
      getAttestationKey()
    )

    return SignatureUtils.serializeSignature(signature)
  }

  async validateAttestation(attestationCode: string) {
    const address = getAccountAddress()
    const attestations = await kit.contracts.getAttestations()
    const isValid = await attestations.validateAttestationCode(
      this.attestationRequest.phoneNumber,
      this.attestationRequest.account,
      address,
      attestationCode
    )

    if (!isValid) {
      Counters.attestationRequestsAttestationErrors.inc()
      throw new Error(ATTESTATION_ERROR)
    }
    return
  }

  async sendSmsAndPersistAttestation(attestationCode: string) {
    const textMessage = createAttestationTextMessage(attestationCode)
    let attestationRecord: AttestationModel | null = null

    const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })

    try {
      attestationRecord = await ensureLockedRecord(this.attestationRequest, transaction)
      const provider = smsProviderFor(this.attestationRequest.phoneNumber)

      if (!provider) {
        await attestationRecord.update(
          { status: AttestationStatus.UNABLE_TO_SERVE, smsProvider: SmsProviderType.UNKNOWN },
          { transaction, logging: this.sequelizeLogger }
        )
        await transaction.commit()
        Counters.attestationRequestsUnableToServe.inc()
        return attestationRecord
      }

      try {
        await provider.sendSms(this.attestationRequest.phoneNumber, textMessage)
        Counters.attestationRequestsSentSms.inc()
        await attestationRecord.update(
          { status: AttestationStatus.SENT, smsProvider: provider.type },
          { transaction, logging: this.sequelizeLogger }
        )
      } catch (err) {
        this.logger.error({ err })
        Counters.attestationRequestsFailedToSendSms.inc()
        await attestationRecord.update(
          { status: AttestationStatus.FAILED, smsProvider: provider.type },
          { transaction, logging: this.sequelizeLogger }
        )
      }

      await transaction.commit()
    } catch (err) {
      this.logger.error({ err })
      await transaction.rollback()
    }

    return attestationRecord
  }

  respondAfterSendingSms(res: express.Response, attestationRecord: AttestationModel | null) {
    if (!attestationRecord) {
      this.logger.error({ err: 'Attestation Record was not created' })
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
        this.logger.error({
          err:
            'Attestation Record should either be failed or sent, but was ' +
            attestationRecord.status,
        })
        respondWithError(res, 500, SMS_SENDING_ERROR)
        return
    }
  }
}

export async function handleAttestationRequest(
  _req: express.Request,
  res: Response,
  attestationRequest: AttestationRequest
) {
  const handler = new AttestationRequestHandler(attestationRequest, res.locals.logger)
  let attestationCode
  try {
    Counters.attestationRequestsTotal.inc()
    await handler.validateAttestationRequest()
    Counters.attestationRequestsValid.inc()
    attestationCode = handler.signAttestation()
    await handler.validateAttestation(attestationCode)
  } catch (err) {
    handler.logger.info({ err })
    respondWithError(res, 422, err.toString())
    return
  }

  try {
    const attestationRecord = await handler.sendSmsAndPersistAttestation(attestationCode)
    handler.respondAfterSendingSms(res, attestationRecord)
  } catch (err) {
    Counters.attestationRequestUnexpectedErrors.inc()
    handler.logger.error({ err })
    respondWithError(res, 500, SMS_SENDING_ERROR)
    return
  }
}
