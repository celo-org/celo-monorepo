import { PhoneNumberUtils } from '@celo/utils'
import { AddressType, E164PhoneNumberType, SaltType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import * as t from 'io-ts'
import { findAttestationByKey } from '../db'
import { AttestationKey, AttestationStatus } from '../models/attestation'
import { ErrorMessages, respondWithError } from '../request'
import { obfuscateNumber } from '../sms/base'

export const VERSION = process.env.npm_package_version as string
export const SIGNATURE_PREFIX = 'attestation-service-status-signature:'

export const GetAttestationRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
  // io-ts way of defining optional key-value pair
  salt: t.union([t.undefined, SaltType]),
})

export type GetAttestationRequest = t.TypeOf<typeof GetAttestationRequestType>

export const GetAttestationResponseType = t.type({
  status: t.string, // TODO AttestationStatusType,
  error: t.union([t.undefined, t.string]),
  provider: t.string,
  attempt: t.number,
})

export type GetAttestationResponse = t.TypeOf<typeof GetAttestationResponseType>

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
  sequelizeLogger: (_msg: string, sequelizeLog: any) => void
  constructor(public readonly getRequest: GetAttestationRequest, logger: Logger) {
    this.logger = logger.child({
      getRequest: obfuscateGetAttestationRequest(getRequest),
    })
    this.sequelizeLogger = (msg: string, sequelizeLogArgs: any) =>
      this.logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)
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
  const handler = new GetAttestationRequestHandler(getRequest, res.locals.Logger)

  try {
    const attestationRecord = await handler.getAttestationRecord()
    if (!attestationRecord) {
      res.status(404)
      return
    }

    res
      .json(
        GetAttestationResponseType.encode({
          status: AttestationStatus[attestationRecord.status],
          error: attestationRecord.errorCode ?? undefined,
          provider: attestationRecord.providers,
          attempt: attestationRecord.attempt,
        })
      )
      .status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
