import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { eqAddress } from '@celo/utils/lib/address'
import Logger from 'bunyan'
import { randomBytes } from 'crypto'
import express from 'express'
import { findAttestationByKey, kit, makeSequelizeLogger, SequelizeLogger } from '../db'
import { getAccountAddress, getAttestationSignerAddress, isDevMode } from '../env'
import { Counters } from '../metrics'
import { AttestationKey, AttestationStatus } from '../models/attestation'
import { AttestationRequest, respondWithAttestation, respondWithError, Response } from '../request'
import { startSendSms } from '../sms'
import { obfuscateNumber } from '../sms/base'

const ATTESTATION_ERROR = 'Valid attestation could not be provided'
const NO_INCOMPLETE_ATTESTATION_FOUND_ERROR = 'No incomplete attestation found'
const ATTESTATION_ALREADY_SENT_ERROR = 'Attestation already sent'

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
    this.sequelizeLogger = makeSequelizeLogger(this.logger)
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

    if (attestationRecord && attestationRecord.status !== AttestationStatus.NotSent) {
      Counters.attestationRequestsAlreadySent.inc()
      throw new Error(ATTESTATION_ALREADY_SENT_ERROR)
    }

    if (!isDevMode()) {
      const attestations = await kit.contracts.getAttestations()
      const state = await attestations.getAttestationState(this.key.identifier, account, issuer)

      if (state.attestationState !== AttestationState.Incomplete) {
        Counters.attestationRequestsWOIncompleteAttestation.inc()
        throw new Error(NO_INCOMPLETE_ATTESTATION_FOUND_ERROR)
      }
    }

    // TODO: Check expiration
    return
  }

  async signAttestation() {
    const { phoneNumber, account, salt } = this.attestationRequest
    const message = AttestationUtils.getAttestationMessageToSignFromPhoneNumber(
      phoneNumber,
      account,
      salt
    )

    try {
      return await kit.web3.eth.sign(message, getAttestationSignerAddress())
    } catch (error) {
      if (isDevMode()) {
        return randomBytes(65).toString('hex')
      } else {
        throw error
      }
    }
  }

  async validateAttestation(attestationCode: string) {
    if (!isDevMode()) {
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
    }
  }

  async sendSms(attestationCode: string) {
    const textMessage = createAttestationTextMessage(
      attestationCode,
      this.attestationRequest.smsRetrieverAppSig
    )

    return startSendSms(
      this.key,
      this.attestationRequest.phoneNumber,
      textMessage,
      this.logger,
      this.sequelizeLogger
    )
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
  } catch (error) {
    handler.logger.info({ error })
    respondWithError(res, 422, `${error.message ?? error}`)
    return
  }

  try {
    const attestation = await handler.sendSms(attestationCode)

    if (attestation.failure()) {
      Counters.attestationRequestsFailedToSendSms.inc()
    } else {
      Counters.attestationRequestsSentSms.inc()
    }

    respondWithAttestation(res, attestation)
  } catch (error) {
    Counters.attestationRequestUnexpectedErrors.inc()
    handler.logger.error({ error })
    respondWithError(res, 500, `${error.message ?? error}`)
    return
  }
}
