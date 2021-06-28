import Vonage from 'nexmo'
import { fetchEnv, fetchEnvOrDefault } from '../env'
import { LookupProvider, LookupProviderType, LookupResult } from './base'

export class VonageLookupProvider extends LookupProvider {
  static fromEnv() {
    try {
      return new VonageLookupProvider(
        fetchEnv('VONAGE_KEY'),
        fetchEnv('VONAGE_SECRET'),
        fetchEnvOrDefault('VONAGE_APPLICATION', '')
      )
    } catch (e) {
      return new VonageLookupProvider(
        fetchEnv('NEXMO_KEY'),
        fetchEnv('NEXMO_SECRET'),
        fetchEnvOrDefault('VONAGE_APPLICATION', '')
      )
    }
  }
  type = LookupProviderType.VONAGE
  client: any
  applicationId: string | null = null

  constructor(apiKey: string, apiSecret: string, applicationId: string) {
    super()
    this.applicationId = applicationId
    if (applicationId) {
      this.client = new Vonage({
        apiKey,
        apiSecret,
      })
    } else {
      this.client = new Vonage({
        apiKey,
        apiSecret,
      })
    }
  }

  lookup = async (number: string) =>
    new Promise<LookupResult>((resolve, reject) =>
      this.client.numberInsight.get(
        {
          level: 'standard',
          number,
        },
        (error: any, { current_carrier, country_code }: any) => {
          if (error) reject(error)
          resolve({ phoneNumberType: current_carrier.network_type, countryCode: country_code })
        }
      )
    )
}
