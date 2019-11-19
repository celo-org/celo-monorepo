import { intersection } from '@celo/utils/lib/collections'
import { E164Number } from '@celo/utils/lib/io'
import { fetchEnv } from '../env'
import { SmsProvider, SmsProviderType } from './base'
import { NexmoSmsProvider } from './nexmo'
import { TwilioSmsProvider } from './twilio'

const smsProviders: SmsProvider[] = []

export async function initializeSmsProviders() {
  const smsProvidersToConfigure = fetchEnv('SMS_PROVIDERS').split(',') as Array<
    SmsProviderType | string
  >

  if (smsProvidersToConfigure.length === 0) {
    throw new Error('You have to specify at least one sms provider')
  }

  for (const configuredSmsProvider of smsProvidersToConfigure) {
    switch (configuredSmsProvider) {
      case SmsProviderType.NEXMO:
        const nexmoProvider = NexmoSmsProvider.fromEnv()
        await nexmoProvider.initialize()
        smsProviders.push(nexmoProvider)
        break
      case SmsProviderType.TWILIO:
        const twilioProvider = TwilioSmsProvider.fromEnv()
        await twilioProvider.initialize()
        smsProviders.push(twilioProvider)
        break
      default:
        throw new Error(`Unknown sms provider type specified: ${configuredSmsProvider}`)
    }
  }
}

export function smsProviderFor(phoneNumber: E164Number) {
  return smsProviders.find((provider) => provider.canServePhoneNumber(phoneNumber))
}

export function configuredSmsProviders() {
  return smsProviders.map((provider) => provider.type)
}

export function blacklistRegionCodes() {
  return intersection(smsProviders.map((provider) => provider.blacklistedRegionCodes))
}
