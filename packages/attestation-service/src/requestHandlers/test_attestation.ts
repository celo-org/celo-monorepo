import { PhoneNumberUtils } from '@celo/utils'
import { AttestationServiceTestRequest } from '@celo/utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { randomBytes } from 'crypto'
import express from 'express'
import { getAccountAddress, getAttestationSignerAddress, isDevMode } from '../env'
import { AttestationStatus } from '../models/attestation'
import { ErrorMessages, respondWithError } from '../request'
import { startSendSms } from '../sms'
import { obfuscateNumber } from '../sms/base'
import { AttestationResponseType } from './attestation'

export { AttestationServiceTestRequestType } from '@celo/utils/lib/io'

export async function handleTestAttestationRequest(
  _req: express.Request,
  res: express.Response,
  testRequest: AttestationServiceTestRequest
) {
  const logger = res.locals.logger.child({
    testProvider: testRequest.provider,
    phoneNumber: obfuscateNumber(testRequest.phoneNumber),
  })

  try {
    // Signature may be via account key or attestation signer (for ReleaseGold specifically)
    // If we're in dev mode, don't do a signature check.
    const accountIsValid =
      isDevMode() ||
      verifySignature(
        testRequest.phoneNumber + testRequest.message,
        testRequest.signature,
        getAccountAddress()
      ) ||
      verifySignature(
        testRequest.phoneNumber + testRequest.message,
        testRequest.signature,
        getAttestationSignerAddress()
      )

    if (!accountIsValid) {
      respondWithError(res, 422, ErrorMessages.INVALID_SIGNATURE)
      return
    }

    // Generate attestation key for the test
    const salt = randomBytes(32).toString('hex')
    const key = {
      identifier: PhoneNumberUtils.getPhoneHash(testRequest.phoneNumber, salt),
      account: getAccountAddress(),
      issuer: getAccountAddress(),
    }

    const sequelizeLogger = (msg: string, sequelizeLogArgs: any) =>
      logger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg)

    const attestation = await startSendSms(
      key,
      testRequest.phoneNumber,
      testRequest.message,
      logger,
      sequelizeLogger,
      testRequest.provider
    )

    res
      .json(
        AttestationResponseType.encode({
          success: attestation.status === AttestationStatus.Sent,
          identifier: attestation.identifier,
          account: attestation.account,
          issuer: attestation.issuer,
          attempt: attestation.attempt,
          countryCode: attestation.countryCode,
          status: AttestationStatus[attestation.status],
          salt,
          provider: attestation.provider() ?? undefined,
          errors: attestation.errors ?? undefined,
        })
      )
      .status(201)
  } catch (error) {
    logger.error(error)
    res
      .json(
        AttestationResponseType.encode({
          status: AttestationStatus[AttestationStatus.NotSent],
          success: false,
          errors: JSON.stringify([`${error.message ?? error}`]),
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
