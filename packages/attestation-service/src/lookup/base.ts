import { E164Number } from '@celo/utils/lib/io'

export abstract class LookupProvider {
  abstract type: LookupProviderType
  unsupportedRegionCodes: string[] = []

  // Should throw Error when unsuccesful, return if successful
  abstract lookup(phoneNumber: E164Number): Promise<LookupResult>
}

export enum LookupProviderType {
  VONAGE = 'vonage',
  UNKNOWN = 'unknown',
  TWILIO = 'twilio',
}

export interface LookupResult {
  phoneNumberType: string
  countryCode: string
}
