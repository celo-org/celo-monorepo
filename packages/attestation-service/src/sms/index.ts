import { E164Number } from '@celo/utils/lib/io'
import { fetchEnv } from '../env'
import { SmsProvider, SmsProviderType } from './base'
import { NexmoSmsProvider } from './nexmo'

const smsProviders: SmsProvider[] = []

export async function initializeSmsProviders() {
  const configuredSmsProviders = fetchEnv('SMS_PROVIDERS').split(',') as Array<
    SmsProviderType | string
  >

  if (configuredSmsProviders.length === 0) {
    throw new Error('You have to specify at least one sms provider')
  }

  for (const configuredSmsProvider of configuredSmsProviders) {
    switch (configuredSmsProvider) {
      case SmsProviderType.NEXMO:
        const provider = NexmoSmsProvider.fromEnv()
        await provider.initialize()
        smsProviders.push(provider)
        break
      default:
        break
    }
  }
}

export function smsProviderFor(phoneNumber: E164Number) {
  return smsProviders.find((provider) => provider.canServePhoneNumber(phoneNumber))
}
