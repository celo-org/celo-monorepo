import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { eqAddress } from '@celo/utils/lib/address'
import { AddressType, E164PhoneNumberType, SaltType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import * as t from 'io-ts'
import { findAttestationByKey, kit } from '../db'
import { getAccountAddress, getAttestationSignerAddress } from '../env'
import { Counters } from '../metrics'
import { AttestationKey, AttestationModel, AttestationStatus } from '../models/attestation'
import { respondWithError, Response } from '../request'
import { startSendSms } from '../sms'
import { obfuscateNumber } from '../sms/base'

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

function obfuscateAttestationRequest(attestationRequest: AttestationRequest) {
  const obfuscatedRequest = { ...attestationRequest }
  obfuscatedRequest.phoneNumber = obfuscateNumber(attestationRequest.phoneNumber)
  return obfuscatedRequest
}

function toBase64(str: string) {
  return Buffer.from(str.slice(2), 'hex').toString('base64')
}

function createAttestationTextMessage(attestationCode: string, smsRetrieverAppSig?: string) {
  const messageBase = `celo://wallet/v/${toBase64(attestationCode)}`
  return smsRetrieverAppSig ? `<#> ${messageBase} ${smsRetrieverAppSig}` : messageBase
}

function getAttestationKey(attestationRequest: AttestationRequest): AttestationKey {
  return {
    identifier: PhoneNumberUtils.getPhoneHash(
      attestationRequest.phoneNumber,
      attestationRequest.salt
    ),
    account: attestationRequest.account,
    issuer: attestationRequest.issuer,
  }
}

class AttestationRequestHandler {
  logger: Logger
  key: AttestationKey
  sequelizeLogger: (_msg: string, sequelizeLog: any) => void
  constructor(public readonly attestationRequest: AttestationRequest, logger: Logger) {
    this.logger = logger.child({
      attestationRequest: obfuscateAttestationRequest(attestationRequest),
    })
    this.sequelizeLogger = (msg: string, sequelizeLogArgs: any) =>
      this.logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)
    this.key = getAttestationKey(this.attestationRequest)
  }

  async validateAttestationRequest() {
    const { account, issuer } = this.attestationRequest

    const attestationRecord = await findAttestationByKey(this.key, {
      logging: this.sequelizeLogger,
    })
    // check if it exists in the database
    if (attestationRecord && !attestationRecord.canSendSms()) {
      Counters.attestationRequestsAlreadySent.inc()
      throw new Error(ATTESTATION_ALREADY_SENT_ERROR)
    }
    const address = getAccountAddress()
    if (!eqAddress(address, issuer)) {
      Counters.attestationRequestsWrongIssuer.inc()
      throw new Error(`Mismatching issuer, I am ${address}`)
    }

    const attestations = await kit.contracts.getAttestations()
    const state = await attestations.getAttestationState(this.key.identifier, account, issuer)

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
    const { account } = this.attestationRequest
    const address = getAccountAddress()
    const attestations = await kit.contracts.getAttestations()
    const isValid = await attestations.validateAttestationCode(
      this.key.identifier,
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

  async sendSms(attestationCode: string) {
    const textMessage = createAttestationTextMessage(
      attestationCode,
      this.attestationRequest.smsRetrieverAppSig
    )

    // TODO metrics
    return startSendSms(this.key, this.attestationRequest.phoneNumber, textMessage)

    // let attestationRecord: AttestationModel | null = null

    // const transaction = await sequelize!.transaction({ logging: this.sequelizeLogger })

    // try {
    //   // attestationRecord = await ensureLockedRecord(
    //   //   this.attestationRequest,
    //   //   this.identifier,
    //   //   transaction
    //   // )

    //   try {
    //     const sentVia = await startSendSms(this.attestationRequest.phoneNumber, textMessage)
    //     Counters.attestationRequestsSentSms.inc()
    //     await attestationRecord.update(
    //       { status: AttestationStatus.SENT, smsProvider: sentVia },
    //       { transaction, logging: this.sequelizeLogger }
    //     )
    //   } catch (err) {
    //     this.logger.error({ err }, 'Failed sending SMS')
    //     Counters.attestationRequestsFailedToSendSms.inc()
    //     await attestationRecord.update(
    //       { status: AttestationStatus.FAILED, smsProvider: SmsProviderType.UNKNOWN },
    //       { transaction, logging: this.sequelizeLogger }
    //     )
    //   }

    //   await transaction.commit()
    // } catch (err) {
    //   this.logger.error({ err })
    //   await transaction.rollback()
    // }
  }

  respondAfterSendingSms(res: express.Response, attestationRecord: AttestationModel | null) {
    if (!attestationRecord) {
      this.logger.error({ err: 'Attestation Record was not created' })
      respondWithError(res, 500, SMS_SENDING_ERROR)
      return
    }

    switch (attestationRecord.status) {
      case AttestationStatus.SENT:
      case AttestationStatus.RECEIPT_DELIVERED:
        res.status(201).json({ success: true })
        return
      case AttestationStatus.RECEIPT_FAILED:
        respondWithError(res, 500, SMS_SENDING_ERROR)
        return
      case AttestationStatus.UNABLE_TO_SERVE: // TODO Verify what Valora is looking for here.
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
    const attestationRecord = await handler.sendSms(attestationCode)
    handler.respondAfterSendingSms(res, attestationRecord)
  } catch (err) {
    Counters.attestationRequestUnexpectedErrors.inc()
    handler.logger.error({ err })
    respondWithError(res, 500, SMS_SENDING_ERROR)
    return
  }
}
