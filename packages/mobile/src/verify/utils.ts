import { parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'

export function getPhoneNumberState(
  phoneNumber: string,
  countryCallingCode: string,
  countryCodeAlpha2: string
) {
  const phoneDetails = parsePhoneNumber(phoneNumber, countryCallingCode)

  if (phoneDetails) {
    return {
      // Show international display number to avoid confusion
      internationalPhoneNumber: phoneDetails.displayNumberInternational,
      e164Number: phoneDetails.e164Number,
      isValidNumber: true,
      countryCodeAlpha2: phoneDetails.regionCode!,
    }
  } else {
    return {
      internationalPhoneNumber: phoneNumber,
      e164Number: '',
      isValidNumber: false,
      countryCodeAlpha2,
    }
  }
}
