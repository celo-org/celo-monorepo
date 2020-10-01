import { PhoneNumberUtils } from '@celo/utils'
import { GetAttestationRequest } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import { findAttestationByKey, makeSequelizeLogger, SequelizeLogger } from '../db'
import { AttestationKey } from '../models/attestation'
import { respondWithAttestation, respondWithError } from '../request'
import { obfuscateNumber } from '../sms/base'

export const VERSION = process.env.npm_package_version as string
export const SIGNATURE_PREFIX = 'attestation-service-status-signature:'

function obfuscateGetAttestationRequest(getRequest: GetAttestationRequest) {
  const obfuscatedRequest = { ...getRequest }
  obfuscatedRequest.phoneNumber = obfuscateNumber(getRequest.phoneNumber)
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

  async getAttestationRecord() {
    return findAttestationByKey(this.key, {
      logging: this.sequelizeLogger,
    })
  }
}

export async function handleGetAttestationRequest(
  _req: express.Request,
  res: express.Response,
  getRequest: GetAttestationRequest
) {
  try {
    const handler = new GetAttestationRequestHandler(getRequest, res.locals.logger)

    const attestation = await handler.getAttestationRecord()
    if (!attestation) {
      respondWithError(res, 404, `Attestation not found`)
      return
    }

    respondWithAttestation(res, attestation, true)
  } catch (error) {
    res.locals.logger.error(error)
    respondWithError(res, 500, `${error.message ?? error}`)
  }
}
