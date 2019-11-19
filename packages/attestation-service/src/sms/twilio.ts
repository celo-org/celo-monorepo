import twilio, { Twilio } from 'twilio'
import { fetchEnv } from '../env'
import { readBlacklistFromEnv, SmsProvider, SmsProviderType } from './base'

export class TwilioSmsProvider extends SmsProvider {
  static fromEnv() {
    return new TwilioSmsProvider(
      fetchEnv('TWILIO_ACCOUNT_SID'),
      fetchEnv('TWILIO_MESSAGING_SERVICE_SID'),
      fetchEnv('TWILIO_AUTH_TOKEN'),
      readBlacklistFromEnv('TWILIO_BLACKLIST')
    )
  }

  client: Twilio
  messagingServiceSid: string
  type = SmsProviderType.TWILIO

  constructor(
    twilioSid: string,
    messagingServiceSid: string,
    twilioAuthToken: string,
    blacklistedRegionCodes: string[]
  ) {
    super()
    this.client = twilio(twilioSid, twilioAuthToken)
    this.messagingServiceSid = messagingServiceSid
    this.blacklistedRegionCodes = blacklistedRegionCodes
  }

  async initialize() {
    // Ensure the messaging service exists
    try {
      await this.client.messaging.services.get(this.messagingServiceSid).fetch()
    } catch (error) {
      throw new Error(`Twilio Messaging Service could not be fetched: ${error}`)
    }
  }

  async sendSms(phoneNumber: string, message: string) {
    await this.client.messages.create({
      body: message,
      to: phoneNumber,
      from: this.messagingServiceSid,
    })
    return
  }
}
