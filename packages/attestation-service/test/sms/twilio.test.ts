import { TwilioMessagingProvider, TwilioVerifyProvider } from '../../src/sms/twilio'
import { mockMessagesCreate, mockVerifyCreate } from '../__mocks__/twilio'

jest.mock('../__mocks__/twilio')

describe('TwilioSmsProvider tests', () => {
  describe('sendSms', () => {
    const twilioSid = 'twilioSid-123!'
    const verifyServiceSid = 'verify-sid-123!'
    const twilioAuthToken = 'fakeAuth-123!'
    const unsupportedRegionCodes = ['GH', 'IJ', 'KL']
    const messagingServiceSid = 'messagingId-123!'
    const attestation = {
      account: '0x123',
      identifier: '0x456',
      issuer: '0x789',
      countryCode: 'AB',
      phoneNumber: '+123456789',
      message: 'test-message',
      securityCode: '01234',
      attestationCode: '56789',
      appSignature: undefined,
      language: 'en',
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should initialize and send SMS via TwilioVerifyProvider', async () => {
      const twilioVerifyProvider = new TwilioVerifyProvider(
        twilioSid,
        twilioAuthToken,
        unsupportedRegionCodes,
        verifyServiceSid
      )
      await twilioVerifyProvider.initialize('fake-delivery-status-url')
      await twilioVerifyProvider.sendSms(attestation)
      expect(mockVerifyCreate).toBeCalledTimes(1)
      expect(mockMessagesCreate).not.toBeCalled()
    })
    it('should initialize and send SMS via TwilioMessagingProvider', async () => {
      const twilioMessagingProvider = new TwilioMessagingProvider(
        twilioSid,
        twilioAuthToken,
        unsupportedRegionCodes,
        messagingServiceSid
      )
      await twilioMessagingProvider.initialize('fake-delivery-status-url')
      await twilioMessagingProvider.sendSms(attestation)
      expect(mockMessagesCreate).toBeCalledTimes(1)
      expect(mockVerifyCreate).not.toBeCalled()
    })
  })
})
