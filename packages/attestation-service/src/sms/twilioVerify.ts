import { fetchEnv } from '../env'
import { SmsFields } from '../models/attestation'
import { readUnsupportedRegionsFromEnv, SmsProviderType } from './base'
import { TwilioSmsProvider } from './twilio'

export class TwilioVerifyProvider extends TwilioSmsProvider {
  static fromEnv() {
    return new TwilioVerifyProvider(
      fetchEnv('TWILIO_ACCOUNT_SID'),
      fetchEnv('TWILIO_AUTH_TOKEN'),
      readUnsupportedRegionsFromEnv('TWILIO_UNSUPPORTED_REGIONS', 'TWILIO_BLACKLIST'),
      fetchEnv('TWILIO_VERIFY_SERVICE_SID')
    )
  }

  verifyServiceSid: string
  type = SmsProviderType.TWILIO_VERIFY

  // https://www.twilio.com/docs/verify/api/verification#start-new-verification
  twilioSupportedLocales = [
    'af',
    'ar',
    'ca',
    'cs',
    'da',
    'de',
    'el',
    'en',
    'en-gb',
    'es',
    'fi',
    'fr',
    'he',
    'hi',
    'hr',
    'hu',
    'id',
    'it',
    'ja',
    'ko',
    'ms',
    'nb',
    'nl',
    'pl',
    'pt',
    'pr-br',
    'ro',
    'ru',
    'sv',
    'th',
    'tl',
    'tr',
    'vi',
    'zh',
    'zh-cn',
    'zh-hk',
  ]

  constructor(
    twilioSid: string,
    twilioAuthToken: string,
    unsupportedRegionCodes: string[],
    verifyServiceSid: string
  ) {
    // Initializes twilio client
    super(twilioSid, twilioAuthToken, unsupportedRegionCodes)
    this.verifyServiceSid = verifyServiceSid
  }

  async initialize(deliveryStatusURL?: string) {
    super.initialize(deliveryStatusURL)
    try {
      await this.client.verify.services
        .get(this.verifyServiceSid)
        .fetch()
        .then((service) => {
          if (!service.customCodeEnabled) {
            // Make sure that custom code is enabled
            throw new Error(
              'TWILIO_VERIFY_SERVICE_SID is specified, but customCode is not enabled. Please contact Twilio support to enable it.'
            )
          }
        })
    } catch (error) {
      throw new Error(`Twilio Verify Service could not be fetched: ${error}`)
    }
  }

  async sendSms(attestation: SmsFields) {
    const requestParams: any = {
      to: attestation.phoneNumber,
      channel: 'sms',
      customCode: attestation.securityCode,
    }

    // This param tells Twilio to add the <#> prefix and app hash postfix
    if (attestation.appSignature) {
      requestParams.appHash = attestation.appSignature
    }
    // Normalize to locales that Twilio supports
    // If locale is not supported, Twilio API will throw an error
    if (attestation.language) {
      const locale = attestation.language.toLocaleLowerCase()
      if (['es-419', 'es-us', 'es-la'].includes(locale)) {
        attestation.language = 'es'
      }
      if (this.twilioSupportedLocales.includes(locale)) {
        requestParams.locale = locale
      }
    }
    let deliveryId: string
    try {
      const m = await this.client.verify
        .services(this.verifyServiceSid)
        .verifications.create(requestParams)
      deliveryId = m.sid
    } catch (e) {
      // Verify landlines using voice
      if (
        e instanceof Error &&
        e.message.includes('SMS is not supported by landline phone number')
      ) {
        requestParams.appHash = undefined
        requestParams.channel = 'call'
        const m = await this.client.verify
          .services(this.verifyServiceSid)
          .verifications.create(requestParams)
        deliveryId = m.sid
      } else {
        throw e
      }
    }
    try {
      // Change status of verification to ensure unique delivery IDs are created
      await this.client.verify
        .services(this.verifyServiceSid)
        .verifications(deliveryId)
        .update({ status: 'canceled' })
    } catch {
      // This shouldn't throw a hard error though as this is to prevent a tiny edge case:
      // >5 Verify requests to the same phone number in <10 min.
      // At this point, the text has been sent; .
      // throw new Error(`Canceling Verify SID ${deliveryId} failed with message ${e}`)
    } finally {
      return deliveryId
    }
  }
}
