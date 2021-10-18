/**
 * Script for testing TwilioSmsProvider.sendSms using the real twilio API.
 * Uses `.env.development` file for sensitive info; set your phone number
 * as TEST_SMS_RECIPIENT to receive the messages and check against
 * expected output (logged in console).
 * Comment out cases under `testCases` as desired.
 */

import { fetchEnv, fetchEnvOrDefault } from '../src/env'
import { SmsFields } from '../src/models/attestation'
import { readUnsupportedRegionsFromEnv } from '../src/sms/base'
import { TwilioSmsProvider } from '../src/sms/twilio'
;(async function main() {
  const twilioSid = fetchEnv('TWILIO_ACCOUNT_SID')
  const messagingServiceSid = fetchEnv('TWILIO_MESSAGING_SERVICE_SID')
  const verifyServiceSid = fetchEnvOrDefault('TWILIO_VERIFY_SERVICE_SID', '')
  const twilioAuthToken = fetchEnv('TWILIO_AUTH_TOKEN')
  const unsupportedRegionCodes = readUnsupportedRegionsFromEnv(
    'TWILIO_UNSUPPORTED_REGIONS',
    'TWILIO_BLACKLIST'
  )
  const testPhoneNumber = fetchEnv('TEST_SMS_RECIPIENT')

  const verifyDisabledRegionCodes = ['US']
  const notVerifyDisabledRegion = 'DE'

  enum SendMethod {
    MESSAGE_SERVICE = 'message service',
    VERIFY = 'verify API',
  }

  type TestCase = {
    id: string
    verifyServiceSid: string
    countryCode: string
    expectedSendMethod: SendMethod
  }

  const testCases: TestCase[] = [
    {
      id: '000000',
      verifyServiceSid,
      countryCode: verifyDisabledRegionCodes[0],
      expectedSendMethod: SendMethod.MESSAGE_SERVICE,
    },
    {
      id: '111111',
      verifyServiceSid,
      countryCode: notVerifyDisabledRegion,
      expectedSendMethod: SendMethod.VERIFY,
    },
    {
      id: '222222',
      verifyServiceSid: '',
      countryCode: notVerifyDisabledRegion,
      expectedSendMethod: SendMethod.MESSAGE_SERVICE,
    },
  ]

  testCases.map(async (testCase: TestCase) => {
    const twilioSmsProvider = new TwilioSmsProvider(
      twilioSid,
      messagingServiceSid,
      testCase.verifyServiceSid,
      verifyDisabledRegionCodes,
      twilioAuthToken,
      unsupportedRegionCodes
    )

    const expectedMsg =
      testCase.expectedSendMethod == SendMethod.MESSAGE_SERVICE
        ? 'via-message:' + testCase.id
        : 'Your Celo verification code is: ' + testCase.id

    const attestation: SmsFields = {
      account: '0x123',
      identifier: '0x456',
      issuer: '0x789',
      countryCode: testCase.countryCode,
      phoneNumber: testPhoneNumber,
      message: testCase.expectedSendMethod == SendMethod.MESSAGE_SERVICE ? expectedMsg : '',
      securityCode: testCase.expectedSendMethod == SendMethod.VERIFY ? testCase.id : '',
      attestationCode: '123',
      appSignature: undefined,
      language: 'en',
    }
    try {
      await twilioSmsProvider.initialize()
      const messageSID = await twilioSmsProvider.sendSms(attestation)
      const messageSIDStart = messageSID.substring(0, 2)
      console.log(`Message SID for id ${testCase.id}: ${messageSID}`)
      console.log(`SMS should match: ${expectedMsg}`)
      if (
        (testCase.expectedSendMethod == SendMethod.MESSAGE_SERVICE && messageSIDStart !== 'SM') ||
        (testCase.expectedSendMethod == SendMethod.VERIFY && messageSIDStart !== 'VE')
      ) {
        throw new Error(`Returned message SID did not match expected starting letters`)
      }
    } catch (e) {
      console.error(e)
    }
  })
})()
