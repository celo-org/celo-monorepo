import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { eqAddress } from '@celo/utils/lib/address'
import { AddressType, E164PhoneNumberType, SaltType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import * as t from 'io-ts'
import moment from 'moment'
import { Op, Transaction } from 'sequelize'
import { existingAttestationRequestRecord, getAttestationTable, kit, sequelize } from '../db'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
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
  // io-ts way of defining optional key-value pair
  salt: t.union([t.undefined, SaltType]),
  smsRetrieverAppSig: t.union([t.undefined, t.string]),
})

export type AttestationRequest = t.TypeOf<typeof AttestationRequestType>

const ATTESTATION_EXPIRY_TIMEOUT_MS = 60 * 60 * 24 * 1000 // 1 day

interface AttestationExpiryCache {
  timestamp: number | null
  expiryInSeconds: number | null
}

const attestationExpiryCache: AttestationExpiryCache = {
  timestamp: null,
  expiryInSeconds: null,
}

function toBase64(str: string) {
  return Buffer.from(str.slice(2), 'hex').toString('base64')
}

function createAttestationTextMessage(attestationCode: string, smsRetrieverAppSig?: string) {
  const messageBase = `celo://wallet/v/${toBase64(attestationCode)}`
  return smsRetrieverAppSig ? `<#> ${messageBase} ${smsRetrieverAppSig}` : messageBase
}

async function ensureLockedRecord(
  attestationRequest: AttestationRequest,
  identifier: string,
  transaction: Transaction
) {
  const AttestationTable = await getAttestationTable()
  await AttestationTable.findOrCreate({
    where: {
      identifier,
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
    identifier,
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

async function purgeExpiredRecords(transaction: Transaction) {
  const expiryTimeInSeconds = await getAttestationExpiryInSeconds()
  const AttestationTable = await getAttestationTable()
  try {
    await AttestationTable.destroy({
      where: {
        createdAt: {
          [Op.lte]: moment()
            .subtract(expiryTimeInSeconds, 'seconds')
            .toDate(),
        },
      },
      transaction,
    })
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
  }
}

async function getAttestationExpiryInSeconds() {
  if (
    attestationExpiryCache.expiryInSeconds &&
    attestationExpiryCache.timestamp &&
    Date.now() - attestationExpiryCache.timestamp < ATTESTATION_EXPIRY_TIMEOUT_MS
  ) {
    return attestationExpiryCache.expiryInSeconds
  }
  const attestations = await kit.contracts.getAttestations()
  const expiryTimeInSeconds = (await attestations.attestationExpiryBlocks()) * 5
  attestationExpiryCache.expiryInSeconds = expiryTimeInSeconds
  attestationExpiryCache.timestamp = Date.now()
  return expiryTimeInSeconds
}

class AttestationRequestHandler {
  logger: Logger
  identifier: string
  sequelizeLogger: (_msg: string, sequelizeLog: any) => void
  constructor(public readonly attestationRequest: AttestationRequest, logger: Logger) {
    this.logger = logger.child({ attestationRequest })
    this.sequelizeLogger = (msg: string, sequelizeLogArgs: any) =>
      this.logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)
    this.identifier = PhoneNumberUtils.getPhoneHash(
      this.attestationRequest.phoneNumber,
      this.attestationRequest.salt
    )
  }

  async validateAttestationRequest() {
    const { phoneNumber, account, issuer } = this.attestationRequest

    const attestationRecord = await existingAttestationRequestRecord(phoneNumber, account, issuer, {
      logging: this.sequelizeLogger,
    })
    // check if it exists in the database
    if (attestationRecord && !attestationRecord.canSendSms()) {
      Counters.attestationRequestsAlreadySent.inc()
      throw new Error(ATTESTATION_ALREADY_SENT_ERROR)
    }
    const address = getAccountAddress()

    // TODO: Check with the new Accounts.sol
    if (!eqAddress(address, issuer)) {
      Counters.attestationRequestsWrongIssuer.inc()
      throw new Error(`Mismatching issuer, I am ${address}`)
    }

    const attestations = await kit.contracts.getAttestations()
    const state = await attestations.getAttestationState(this.identifier, account, issuer)

    if (state.attestationState !== AttestationState.Incomplete) {
      Counters.attestationRequestsWOIncompleteAttestation.inc()
      throw new Error(NO_INCOMPLETE_ATTESTATION_FOUND_ERROR)
    }

    // TODO: Check expiration
    return
  }

  signAttestation() {
    const { phoneNumber, account, salt } = this.attestationRequest
    const message = AttestationUtils.getAttestationMessageToSignFromPhoneNumber(
      phoneNumber,
      account,
      salt
    )

    return kit.web3.eth.sign(message, getAttestationSignerAddress())
  }

  async validateAttestation(attestationCode: string) {
    const { phoneNumber, account, salt } = this.attestationRequest
    const address = getAccountAddress()
    const identifier = PhoneNumberUtils.getPhoneHash(phoneNumber, salt)
    const attestations = await kit.contracts.getAttestations()
    const isValid = await attestations.validateAttestationCode(
      identifier,
      account,
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
    const textMessage = createAttestationTextMessage(
      attestationCode,
      this.attestationRequest.smsRetrieverAppSig
    )
    let attestationRecord: AttestationModel | null = null

    const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })

    try {
      attestationRecord = await ensureLockedRecord(
        this.attestationRequest,
        this.identifier,
        transaction
      )
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
        this.logger.info('Sent sms')
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
        return
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

  async purgeExpiredAttestations() {
    const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })
    return purgeExpiredRecords(transaction)
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
    attestationCode = await handler.signAttestation()
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
  await handler.purgeExpiredAttestations()
}
