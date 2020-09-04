import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { eqAddress } from '@celo/utils/lib/address'
import { AddressType, E164PhoneNumberType, SaltType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import * as t from 'io-ts'
import { findAttestationByKey, kit, SequelizeLogger } from '../db'
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

export const AttestationResponseType = t.type({
  // Always returned in 1.0.x
  success: t.boolean,

  // Returned for errors in 1.0.x
  error: t.union([t.undefined, t.string]),

  // Returned for successful send in 1.0.x
  provider: t.union([t.undefined, t.string]),

  // New fields
  identifier: t.union([t.undefined, t.string]),
  account: t.union([t.undefined, AddressType]),
  issuer: t.union([t.undefined, AddressType]),
  status: t.union([t.undefined, t.string]),
  attempt: t.union([t.undefined, t.number]),
  countryCode: t.union([t.undefined, t.string]),

  // Only used by test endpoint to return randomly generated salt.
  salt: t.union([t.undefined, t.string]),
})

export type AttestationResponse = t.TypeOf<typeof AttestationResponseType>

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
  sequelizeLogger: SequelizeLogger
  constructor(public readonly attestationRequest: AttestationRequest, logger: Logger) {
    this.logger = logger.child({
      account: attestationRequest.account,
      issuer: attestationRequest.issuer,
      phoneNumber: obfuscateNumber(attestationRequest.phoneNumber),
    })
    this.sequelizeLogger = (msg: string, sequelizeLogArgs: any) =>
      this.logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)
    this.key = getAttestationKey(this.attestationRequest)
  }

  async validateAttestationRequest() {
    const { account, issuer } = this.attestationRequest

    const address = getAccountAddress()
    if (!eqAddress(address, issuer)) {
      Counters.attestationRequestsWrongIssuer.inc()
      throw new Error(`Mismatching issuer, I am ${address}`)
    }

    const attestationRecord = await findAttestationByKey(this.key, {
      logging: this.sequelizeLogger,
    })

    // TODO what conditions should we allow retransmit under
    if (attestationRecord && attestationRecord.status !== AttestationStatus.NotSent) {
      Counters.attestationRequestsAlreadySent.inc()
      throw new Error(ATTESTATION_ALREADY_SENT_ERROR)
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
    return startSendSms(
      this.key,
      this.attestationRequest.phoneNumber,
      textMessage,
      this.logger,
      this.sequelizeLogger
    )
  }

  respondAfterSendingSms(res: express.Response, attestationRecord: AttestationModel | null) {
    if (!attestationRecord) {
      this.logger.error({ err: 'Attestation Record was not created' })
      respondWithError(res, 500, SMS_SENDING_ERROR)
      return
    }

    switch (attestationRecord.status) {
      case AttestationStatus.Sent:
      case AttestationStatus.Delivered:
        res.status(201).json({ success: true, status: attestationRecord.status })
        return
      // TODO what conditions which reply
      // case AttestationStatus.:
      //   respondWithError(res, 500, SMS_SENDING_ERROR)
      //   return
      case AttestationStatus.NotSent: // TODO Verify what Valora is looking for here.
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
