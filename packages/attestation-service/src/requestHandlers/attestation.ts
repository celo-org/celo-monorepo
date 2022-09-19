import { AttestationState } from '@celo/contractkit/lib/wrappers/Attestations'
import { OdisUtils } from '@celo/identity'
import { getPepperFromThresholdSignature } from '@celo/identity/lib/odis/phone-number-identifier'
import { PhoneNumberUtils } from '@celo/phone-utils'
import { AttestationRequest } from '@celo/phone-utils/lib/io'
import { AttestationUtils } from '@celo/utils'
import { eqAddress } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import Logger from 'bunyan'
import { randomBytes } from 'crypto'
import express from 'express'
import { findAttestationByKey, makeSequelizeLogger, SequelizeLogger, useKit } from '../db'
import {
  fetchEnvOrDefault,
  getAccountAddress,
  getAttestationSignerAddress,
  isDevMode,
} from '../env'
import { Counters } from '../metrics'
import { AttestationKey, AttestationModel } from '../models/attestation'
import { ErrorWithResponse, respondWithAttestation, respondWithError, Response } from '../request'
import { rerequestAttestation, startSendSms } from '../sms'
import { obfuscateNumber } from '../sms/base'

const ATTESTATION_ERROR = 'Valid attestation could not be provided'
const NO_INCOMPLETE_ATTESTATION_FOUND_ERROR = 'No incomplete attestation found'
export const INVALID_SIGNATURE_ERROR = 'Signature is invalid'

const odisPubKey = OdisUtils.Query.getServiceContext(
  fetchEnvOrDefault('NETWORK', 'mainnet')
).odisPubKey
const thresholdBls = require('blind-threshold-bls')

function toBase64(str: string) {
  return Buffer.from(str.slice(2), 'hex').toString('base64')
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

// TODO proper localization
function getSecurityCodeText(language: string | undefined) {
  switch (language) {
    case 'es':
    case 'es-419':
    case 'es-US':
    case 'es-LA': {
      return 'Código de seguridad de Celo'
    }
    case 'pt':
    case 'pt-BR': {
      return 'Esse é o seu código de segurança Celo'
    }
    default: {
      return 'Celo security code'
    }
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

    await this.verifyPepperIfApplicable()

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
    const attestations = await useKit((kit) => kit.contracts.getAttestations())
    for (let i = 0; i < 4; i++) {
      try {
        const state = await attestations.getAttestationState(this.key.identifier, account, issuer)
        if (state?.attestationState === AttestationState.Incomplete) {
          Counters.attestationRequestsValid.inc()
          return null
        } else if (state?.attestationState === AttestationState.Complete) {
          break
        }
        // tslint:disable-next-line: no-empty
      } catch {}
      await sleep(2500)
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
      return await useKit((kit) => kit.connection.sign(message, getAttestationSignerAddress()))
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
      const attestations = await useKit((kit) => kit.contracts.getAttestations())
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
    if (
      !this.attestationRequest.securityCodePrefix ||
      this.attestationRequest.securityCodePrefix.length !== 1
    ) {
      throw new ErrorWithResponse('Invalid securityCodePrefix', 422)
    }

    let attestation = await this.findOrValidateRequest()

    if (attestation && attestation.message) {
      // Re-request existing attestation. In this case, security code prefix is ignored (the message sent is the same as before)
      attestation = await rerequestAttestation(
        this.key,
        this.attestationRequest.smsRetrieverAppSig,
        this.attestationRequest.language,
        this.attestationRequest.securityCodePrefix,
        this.logger,
        this.sequelizeLogger
      )
    } else {
      // New attestation: create new attestation code, new delivery.
      const attestationCode = await this.signAttestation()
      await this.validateAttestationCode(attestationCode)
      // This attestation code is stored in the attestation object
      // and will be returned to the user with the get_attestation call
      const attestationCodeDeeplink = `celo://wallet/v/${toBase64(attestationCode)}`

      let messageBase, securityCode

      // Generate a security code to be sent over SMS
      securityCode = randomBytes(7)
        .map((x) => x % 10)
        .join('')
      securityCode = `${this.attestationRequest.securityCodePrefix}${securityCode}`
      messageBase = `${getSecurityCodeText(this.attestationRequest.language)}: ${securityCode}`

      let textMessage

      // Append with the retriever appsig.
      if (this.attestationRequest.smsRetrieverAppSig) {
        if (!this.attestationRequest.smsRetrieverAppSig.match('^[\\w+]{5,12}$')) {
          throw new ErrorWithResponse('Invalid smsRetrieverAppSig', 422)
        }
        textMessage = `<#> ${messageBase} ${this.attestationRequest.smsRetrieverAppSig}`
      } else {
        textMessage = messageBase
      }

      attestation = await startSendSms(
        this.key,
        this.attestationRequest.phoneNumber,
        textMessage,
        securityCode,
        attestationCodeDeeplink,
        this.attestationRequest.smsRetrieverAppSig,
        this.attestationRequest.language,
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

  private async verifyPepperIfApplicable(): Promise<void> {
    if (this.attestationRequest.phoneNumberSignature && this.attestationRequest.salt) {
      const sigBuf = Buffer.from(this.attestationRequest.phoneNumberSignature, 'base64')

      try {
        await thresholdBls.verify(
          Buffer.from(odisPubKey, 'base64'),
          Buffer.from(this.attestationRequest.phoneNumber, 'base64'),
          sigBuf
        )

        const pepper = getPepperFromThresholdSignature(sigBuf)
        if (pepper !== this.attestationRequest.salt) {
          this.logger.error('Pepper is invalid')
          // temporarily only silently fail, so as not to block users
          // throw new ErrorWithResponse('Pepper is invalid', 422)
        }
      } catch (e) {
        this.logger.error('Cannot get phone number from signature', e)
        throw new ErrorWithResponse(INVALID_SIGNATURE_ERROR, 422)
      }
    }
    Counters.attestationRequestsDidNotProvideSignature.inc()
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
  } catch (error: any) {
    if (!error.responseCode) {
      handler.logger.error({ error })
      Counters.attestationRequestUnexpectedErrors.inc()
    } else {
      handler.logger.info({ error })
    }
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
