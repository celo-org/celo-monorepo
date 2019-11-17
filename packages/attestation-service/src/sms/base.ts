import { E164Number } from '@celo/utils/lib/io'
import { PhoneNumberUtil } from 'google-libphonenumber'
const phoneUtil = PhoneNumberUtil.getInstance()

export abstract class SmsProvider {
  abstract type: SmsProviderType
  blacklistedRegionCodes: string[] = []

  canServePhoneNumber(phoneNumber: E164Number) {
    const countryCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber))
    return !!countryCode && !this.blacklistedRegionCodes.includes(countryCode)
  }
  // Should throw Error when unsuccesful, return if successful
  abstract sendSms(phoneNumber: E164Number, message: string): Promise<void>
}

export enum SmsProviderType {
  NEXMO = 'nexmo',
  UNKNOWN = 'unknown',
}
