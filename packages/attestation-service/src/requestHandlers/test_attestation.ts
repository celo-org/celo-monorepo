import { PhoneNumberUtils } from '@celo/phone-utils'
import { AttestationServiceTestRequest } from '@celo/phone-utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { randomBytes } from 'crypto'
import express from 'express'
import { getAccountAddress, getAttestationSignerAddress, isDevMode } from '../env'
import { ErrorMessages, respondWithAttestation, respondWithError } from '../request'
import { startSendSms } from '../sms'
import { obfuscateNumber } from '../sms/base'

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
      '12345678',
      testRequest.message,
      undefined,
      undefined,
      logger,
      sequelizeLogger,
      testRequest.provider
    )

    respondWithAttestation(res, attestation, false, salt)
  } catch (error: any) {
    logger.error(error)
    respondWithError(res, 500, `${error.message ?? error}`)
  }
}
