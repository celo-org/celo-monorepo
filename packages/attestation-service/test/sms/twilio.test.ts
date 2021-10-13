import { AttestationStatus, SmsAttestation } from '../../src/models/attestation'
import { TwilioSmsProvider } from '../../src/sms/twilio'
import { mockMessagesCreate, mockVerifyCreate } from '../__mocks__/twilio'

jest.mock('../__mocks__/twilio')

describe('TwilioSmsProvider tests', () => {
  describe('sendSMS', () => {
    const twilioSid = 'twilioSid-123!'
    const messagingServiceSid = 'messagingId-123!'
    const verifyServiceSid = 'verify-sid-123!'
    const verifyDisabledRegionCodes = ['CD', 'EF']
    const twilioAuthToken = 'fakeAuth-123!'
    const unsupportedRegionCodes = ['GH', 'IJ', 'KL']
    let attestation: SmsAttestation

    beforeEach(() => {
      jest.clearAllMocks()
      attestation = {
        account: '0x123',
        identifier: '0x456',
        issuer: '0x789',
        countryCode: 'AB',
        phoneNumber: '+123456789',
        message: 'test-message',
        securityCode: '01234',
        attestationCode: '56789',
        ongoingDeliveryId: null,
        securityCodeAttempt: 0,
        providers: 'twilio',
        attempt: 0,
        status: AttestationStatus.NotSent,
        appSignature: undefined,
        language: 'en',
      }
    })

    it('should use verify service if country is not disabled', async () => {
      const twilioSmsProvider = new TwilioSmsProvider(
        twilioSid,
        messagingServiceSid,
        verifyServiceSid,
        verifyDisabledRegionCodes,
        twilioAuthToken,
        unsupportedRegionCodes
      )
      await twilioSmsProvider.initialize('fake-delivery-status-url')
      await twilioSmsProvider.sendSms(attestation)
      expect(mockVerifyCreate).toBeCalledTimes(1)
      expect(mockMessagesCreate).not.toBeCalled()
    })
    it('should use message service if country is disabled', async () => {
      const twilioSmsProvider = new TwilioSmsProvider(
        twilioSid,
        messagingServiceSid,
        verifyServiceSid,
        verifyDisabledRegionCodes,
        twilioAuthToken,
        unsupportedRegionCodes
      )
      attestation.countryCode = verifyDisabledRegionCodes[0]
      await twilioSmsProvider.initialize('fake-delivery-status-url')
      await twilioSmsProvider.sendSms(attestation)
      expect(mockMessagesCreate).toBeCalledTimes(1)
      expect(mockVerifyCreate).not.toBeCalled()
    })
    it('should use message service if verify service is not enabled', async () => {
      const twilioSmsProvider = new TwilioSmsProvider(
        twilioSid,
        messagingServiceSid,
        '',
        verifyDisabledRegionCodes,
        twilioAuthToken,
        unsupportedRegionCodes
      )
      await twilioSmsProvider.initialize('fake-delivery-status-url')
      await twilioSmsProvider.sendSms(attestation)
      expect(mockMessagesCreate).toBeCalledTimes(1)
      expect(mockVerifyCreate).not.toBeCalled()
    })
  })
})
