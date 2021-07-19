import { E164Number } from '@celo/utils/lib/io'
import twilio, { Twilio } from 'twilio'
import { fetchEnv } from '../env'
import { LookupProvider, LookupProviderType, LookupResult } from './base'

export class TwilioLookupProvider extends LookupProvider {
  static fromEnv() {
    return new TwilioLookupProvider(fetchEnv('TWILIO_ACCOUNT_SID'), fetchEnv('TWILIO_AUTH_TOKEN'))
  }

  client: Twilio
  type = LookupProviderType.TWILIO

  constructor(twilioSid: string, twilioAuthToken: string) {
    super()
    this.client = twilio(twilioSid, twilioAuthToken)
  }

  async lookup(phoneNumber: E164Number): Promise<LookupResult> {
    return this.client.lookups.v1
      .phoneNumbers(phoneNumber)
      .fetch({ type: 'carrier' })
      .then(({ countryCode, carrier }) => ({ countryCode, phoneNumberType: carrier.type }))
  }
}
