import { PhoneNumberUtils } from '@celo/utils'
import { AddressType, E164PhoneNumberType, SaltType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import * as t from 'io-ts'
import { findAttestationByKey } from '../db'
import { AttestationKey, AttestationStatus } from '../models/attestation'
import { obfuscateNumber } from '../sms/base'
import { AttestationResponseType } from './attestation'

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
  try {
    const handler = new GetAttestationRequestHandler(getRequest, res.locals.logger)

    const attestation = await handler.getAttestationRecord()
    if (!attestation) {
      res.status(404)
      return
    }
    res
      .json(
        AttestationResponseType.encode({
          success: true,
          identifier: attestation.identifier,
          account: attestation.account,
          issuer: attestation.issuer,
          attempt: attestation.attempt,
          countryCode: attestation.countryCode,
          status: AttestationStatus[attestation.status],
          provider: attestation.provider() ?? undefined,
          errors: attestation.errors ?? undefined,
          salt: undefined,
        })
      )
      .status(200)
  } catch (error) {
    res.locals.logger.error(error)
    res
      .json(
        AttestationResponseType.encode({
          success: false,
          errors: JSON.stringify([`${error.message ?? error}`]),
          status: undefined,
          salt: undefined,
          identifier: undefined,
          account: undefined,
          issuer: undefined,
          provider: undefined,
          attempt: undefined,
          countryCode: undefined,
        })
      )
      .status(500)
  }
}
