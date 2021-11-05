/**
 * Script for testing TwilioSmsProvider.sendSms
 * (Verify & Messaging Services) using the real twilio API.
 * Uses `.env.development` file for sensitive info; set your phone number
 * as TEST_SMS_RECIPIENT to receive the messages and check against
 * expected output (logged in console).
 * Comment out cases under `testCases` as desired.
 */

import { fetchEnv, fetchEnvOrDefault } from '../src/env'
import { SmsFields } from '../src/models/attestation'
import { readUnsupportedRegionsFromEnv } from '../src/sms/base'
import { TwilioSmsProvider } from '../src/sms/twilio'
import { TwilioMessagingProvider } from '../src/sms/twilioMessaging'
import { TwilioVerifyProvider } from '../src/sms/twilioVerify'
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
  const countryCode = 'DE'

  enum SendMethod {
    MESSAGE_SERVICE = 'message service',
    VERIFY = 'verify API',
  }

  type TestCase = {
    id: string
    expectedSendMethod: SendMethod
  }

  const testCases: TestCase[] = [
    {
      id: '000000',
      expectedSendMethod: SendMethod.MESSAGE_SERVICE,
    },
    {
      id: '111111',
      expectedSendMethod: SendMethod.VERIFY,
    },
  ]

  testCases.map(async (testCase: TestCase) => {
    const attestation: SmsFields = {
      account: '0x123',
      identifier: '0x456',
      issuer: '0x789',
      countryCode: countryCode,
      phoneNumber: testPhoneNumber,
      message: '',
      securityCode: '',
      attestationCode: '123',
      appSignature: undefined,
      language: 'en',
    }

    let twilioSmsProvider: TwilioSmsProvider
    let expectedMsg: string
    let expectedSidStart: string

    switch (testCase.expectedSendMethod) {
      case SendMethod.MESSAGE_SERVICE:
        twilioSmsProvider = new TwilioMessagingProvider(
          twilioSid,
          twilioAuthToken,
          unsupportedRegionCodes,
          messagingServiceSid
        )
        expectedMsg = attestation.message = 'via-message:' + testCase.id
        expectedSidStart = 'SM'
        break
      case SendMethod.VERIFY:
        twilioSmsProvider = new TwilioVerifyProvider(
          twilioSid,
          twilioAuthToken,
          unsupportedRegionCodes,
          verifyServiceSid
        )
        expectedMsg = 'Your Celo verification code is: ' + testCase.id
        attestation.securityCode = testCase.id
        expectedSidStart = 'VE'
        break
    }

    try {
      await twilioSmsProvider.initialize()
      const messageSID = await twilioSmsProvider.sendSms(attestation)
      const messageSIDStart = messageSID.substring(0, 2)
      console.log(`Message SID for id ${testCase.id}: ${messageSID}`)
      console.log(`SMS should match: ${expectedMsg}`)
      if (messageSIDStart !== expectedSidStart) {
        throw new Error(`Returned message SID did not match expected starting letters`)
      }
    } catch (e) {
      console.error(e)
    }
  })
})()
