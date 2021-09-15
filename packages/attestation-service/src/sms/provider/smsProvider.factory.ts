import { fetchEnv, fetchEnvOrDefault, isYes } from '../../env'
import { MessageBirdSmsProvider } from './providers/messagebird'
import { NexmoSmsProvider } from './providers/nexmo'
import { TelekomSmsProvider } from './providers/telekom'
import { TwilioSmsProvider } from './providers/twilio'
import { SmsProvider } from './smsProvider'
import { SmsProviderType } from './smsProvider.enum'

export class SmsProviderFactory {
  public createSmsProvider(smsProviderType: SmsProviderType): SmsProvider {
    switch (smsProviderType) {
      case SmsProviderType.MESSAGEBIRD:
        return new MessageBirdSmsProvider(
          fetchEnv('MESSAGEBIRD_API_KEY'),
          this.readUnsupportedRegionsFromEnv('MESSAGEBIRD_UNSUPPORTED_REGIONS')
        )
      case SmsProviderType.NEXMO:
        return new NexmoSmsProvider(
          fetchEnv('NEXMO_KEY'),
          fetchEnv('NEXMO_SECRET'),
          fetchEnvOrDefault('NEXMO_APPLICATION', ''),
          this.readUnsupportedRegionsFromEnv('NEXMO_UNSUPPORTED_REGIONS', 'NEXMO_BLACKLIST'),
          isYes(fetchEnvOrDefault('NEXMO_ACCOUNT_BALANCE_METRIC', ''))
        )
      case SmsProviderType.TELEKOM:
        return new TelekomSmsProvider(
          fetchEnv('TELEKOM_API_KEY'),
          fetchEnv('TELEKOM_FROM'),
          fetchEnvOrDefault('TELEKOM_URL', 'https://developer-api.telekom.com/vms/Messages.json'),
          this.readUnsupportedRegionsFromEnv('TELEKOM_UNSUPPORTED_REGIONS')
        )
      case SmsProviderType.TWILIO:
        return new TwilioSmsProvider(
          fetchEnv('TWILIO_ACCOUNT_SID'),
          fetchEnv('TWILIO_MESSAGING_SERVICE_SID'),
          fetchEnvOrDefault('TWILIO_VERIFY_SERVICE_SID', ''),
          fetchEnv('TWILIO_AUTH_TOKEN'),
          this.readUnsupportedRegionsFromEnv('TWILIO_UNSUPPORTED_REGIONS', 'TWILIO_BLACKLIST')
        )
      case SmsProviderType.UNKNOWN:
        throw new Error(`Unknown sms provider type specified: ${smsProviderType}`)
    }
  }

  private readUnsupportedRegionsFromEnv(...envVarNames: string[]) {
    return envVarNames
      .map((envVarName) =>
        fetchEnvOrDefault(envVarName, '')
          .toUpperCase()
          .split(',')
          .filter((code) => code !== '')
      )
      .reduce((acc, v) => acc.concat(v), [])
  }
}
