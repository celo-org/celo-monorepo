import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { eqAddress } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import { AttestationRequest } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import { randomBytes } from 'crypto'
import express from 'express'
import { findAttestationByKey, kit, makeSequelizeLogger, SequelizeLogger } from '../db'
import { getAccountAddress, getAttestationSignerAddress, isDevMode } from '../env'
import { Counters } from '../metrics'
import { AttestationKey, AttestationModel } from '../models/attestation'
import { ErrorWithResponse, respondWithAttestation, respondWithError, Response } from '../request'
import { rerequestAttestation, startSendSms } from '../sms'
import { obfuscateNumber } from '../sms/base'

const ATTESTATION_ERROR = 'Valid attestation could not be provided'
const NO_INCOMPLETE_ATTESTATION_FOUND_ERROR = 'No incomplete attestation found'
const ATTESTATION_ALREADY_SENT_ERROR = 'Attestation already sent'

// Time within which we allow forcing a retry of completed (or any state) attestations
const allowRetryWithinCompletedMs = 20 * 60 * 1000

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

  async findOrValidateRequest(): Promise<AttestationModel | null> {
    const { account, issuer } = this.attestationRequest

    const address = getAccountAddress()
    if (!eqAddress(address, issuer)) {
      Counters.attestationRequestsWrongIssuer.inc()
      throw new ErrorWithResponse(`Mismatching issuer, I am ${address}`, 422)
    }

    const attestation = await findAttestationByKey(this.key, {
      logging: this.sequelizeLogger,
    })

    if (attestation && attestation.completedAt) {
      const completedAgo = Date.now() - attestation.completedAt!.getTime()
      if (completedAgo >= allowRetryWithinCompletedMs) {
        Counters.attestationRequestsAlreadySent.inc()
        throw new ErrorWithResponse(ATTESTATION_ALREADY_SENT_ERROR, 422)
      }
    }

    // Re-requests for existing attestations skip the on-chain check.
    if (attestation) {
      Counters.attestationRequestsRerequest.inc()
      return attestation
    }

    if (isDevMode()) {
      return attestation
    }

    // Check the on-chain status of the attestation. If it's marked Complete, don't do it.
    // If it's missing, the full node could be behind by a block or two. Try a few times before erroring.
    const attestations = await kit.contracts.getAttestations()
    for (let i = 0; i < 4; i++) {
      const state = await attestations.getAttestationState(this.key.identifier, account, issuer)
      if (state.attestationState === AttestationState.Incomplete) {
        Counters.attestationRequestsValid.inc()
        return null
      } else if (state.attestationState === AttestationState.Complete) {
        break
      } else {
        await sleep(2500)
      }
    }

    Counters.attestationRequestsWOIncompleteAttestation.inc()
    throw new ErrorWithResponse(NO_INCOMPLETE_ATTESTATION_FOUND_ERROR, 422)

    // TODO: Check expiration
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

  async validateAttestationCode(attestationCode: string) {
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
        throw new ErrorWithResponse(ATTESTATION_ERROR, 422)
      }
    }
  }

  // Main process for handling an attestation.
  async doAttestation() {
    Counters.attestationRequestsTotal.inc()
    let attestation = await this.findOrValidateRequest()

    if (attestation && attestation.message) {
      // Re-request existing attestation
      attestation = await rerequestAttestation(this.key, this.logger, this.sequelizeLogger)
    } else {
      // New attestation: create text message, new delivery.
      const attestationCode = await this.signAttestation()
      await this.validateAttestationCode(attestationCode)

      const textMessage = createAttestationTextMessage(
        attestationCode,
        this.attestationRequest.smsRetrieverAppSig
      )

      attestation = await startSendSms(
        this.key,
        this.attestationRequest.phoneNumber,
        textMessage,
        this.logger,
        this.sequelizeLogger
      )
    }

    if (attestation.failure()) {
      Counters.attestationRequestsFailedToSendSms.inc()
    } else {
      Counters.attestationRequestsSentSms.inc()
    }

    return attestation
  }
}

export async function handleAttestationRequest(
  _req: express.Request,
  res: Response,
  attestationRequest: AttestationRequest
) {
  const handler = new AttestationRequestHandler(attestationRequest, res.locals.logger)
  try {
    const attestation = await handler.doAttestation()
    respondWithAttestation(res, attestation)
  } catch (error) {
    if (!error.responseCode) {
      handler.logger.error({ error })
      Counters.attestationRequestUnexpectedErrors.inc()
    } else {
      handler.logger.info({ error })
    }
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
