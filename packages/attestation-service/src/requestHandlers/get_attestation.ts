import { PhoneNumberUtils } from '@celo/phone-utils'
import { GetAttestationRequest } from '@celo/phone-utils/lib/io'
import { isValidAddress, publicKeyToAddress } from '@celo/utils/lib/address'
import { verifyEIP712TypedDataSigner } from '@celo/utils/lib/signatureUtils'
import { attestationSecurityCode as buildSecurityCodeTypedData } from '@celo/utils/lib/typed-data-constructors'
import Logger from 'bunyan'
import express from 'express'
import { Transaction } from 'sequelize'
import {
  findAttestationByKey,
  makeSequelizeLogger,
  sequelize,
  SequelizeLogger,
  useKit,
} from '../db'
import { AttestationKey, AttestationModel } from '../models/attestation'
import { ErrorWithResponse, respondWithAttestation, respondWithError } from '../request'
import { obfuscateNumber } from '../sms/base'

const MAX_SECURITY_CODE_ATTEMPTS = 5

function obfuscateGetAttestationRequest(getRequest: GetAttestationRequest) {
  const obfuscatedRequest = { ...getRequest }
  obfuscatedRequest.phoneNumber = obfuscateNumber(getRequest.phoneNumber)
  if (obfuscatedRequest.securityCode) {
    obfuscatedRequest.securityCode = 'XXX'
  }
  return obfuscatedRequest
}

function getAttestationKey(getRequest: GetAttestationRequest): AttestationKey {
  return {
    identifier: PhoneNumberUtils.getPhoneHash(getRequest.phoneNumber, getRequest.salt),
    account: getRequest.account,
    issuer: getRequest.issuer,
  }
}

class GetAttestationRequestHandler {
  logger: Logger
  key: AttestationKey
  sequelizeLogger: SequelizeLogger
  constructor(public readonly getRequest: GetAttestationRequest, logger: Logger) {
    this.logger = logger.child({
      getRequest: obfuscateGetAttestationRequest(getRequest),
    })
    this.sequelizeLogger = makeSequelizeLogger(this.logger)
    this.key = getAttestationKey(getRequest)
  }

  async withAttestationAndSecurityCodeChecked(
    callback: (attestation: AttestationModel, attestationCode: string | null) => any
  ) {
    const transaction = await sequelize!.transaction({
      logging: this.sequelizeLogger,
      type: Transaction.TYPES.IMMEDIATE,
    })
    try {
      const attestation = await findAttestationByKey(this.key, {
        transaction,
        lock: Transaction.LOCK.UPDATE,
      })

      if (!attestation) {
        throw new ErrorWithResponse('Attestation not found', 404)
      }

      if (attestation.securityCodeAttempt >= MAX_SECURITY_CODE_ATTEMPTS) {
        throw new ErrorWithResponse('Security code attempts exceeded', 403)
      }

      // No security code supplied in request. Just show other metadata.
      if (!this.getRequest.securityCode) {
        callback(attestation, null)
        await transaction.commit()
        return
      }

      // Security code is supplied. Check it's correct.
      // Check with both methods (can remove second method after 1.3.0)
      if (
        attestation.securityCode &&
        (attestation.securityCode.slice(1) === this.getRequest.securityCode ||
          attestation.securityCode === this.getRequest.securityCode)
      ) {
        callback(attestation, attestation.attestationCode)
        await transaction.commit()
        return
      }

      attestation.securityCodeAttempt += 1
      await attestation.save({ transaction, logging: this.sequelizeLogger })
      await transaction.commit()
    } catch (error) {
      transaction.rollback()
      throw error
    }

    throw new ErrorWithResponse('Invalid security code', 403)
  }
}

export async function handleGetAttestationRequest(
  req: express.Request,
  res: express.Response,
  getRequest: GetAttestationRequest
) {
  if (getRequest.securityCode) {
    const {
      headers: { authentication },
    } = req
    if (!authentication) {
      respondWithError(res, 401, 'Missing authentication')
      return
    }

    const typedData = buildSecurityCodeTypedData(getRequest.securityCode)
    const accounts = await useKit((kit) => kit.contracts.getAccounts())
    const [walletAddress, dekAddress] = await Promise.all([
      accounts.getWalletAddress(getRequest.account),
      accounts.getDataEncryptionKey(getRequest.account).then((x) => x && publicKeyToAddress(x)),
    ])

    const validSignature = [getRequest.account, walletAddress, dekAddress]
      .filter(Boolean)
      .filter(isValidAddress)
      .find((address) => verifyEIP712TypedDataSigner(typedData, authentication as string, address))
    if (!validSignature) {
      respondWithError(res, 401, 'Invalid signature')
      return
    }
  }

  try {
    const handler = new GetAttestationRequestHandler(getRequest, res.locals.logger)

    await handler.withAttestationAndSecurityCodeChecked((attestation, attestationCode) => {
      respondWithAttestation(res, attestation, true, undefined, attestationCode)
    })
  } catch (error: any) {
    if (!error.responseCode) {
      res.locals.logger.error({ error })
    } else {
      res.locals.logger.info({ error })
    }
    respondWithError(res, error.responseCode ?? 500, `${error.message ?? error}`)
  }
}
