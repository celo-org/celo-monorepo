export interface ParsedPhoneNumber {
  e164Number: string
  displayNumber: string
  displayNumberInternational: string
  countryCode?: number
  regionCode?: string
}

const E164_REGEX = /^\+[1-9][0-9]{1,14}$/

export function isE164Number(phoneNumber: string) {
  return E164_REGEX.test(phoneNumber)
}

export function anonymizedPhone(phoneNumber: string) {
  return phoneNumber.slice(0, -4) + 'XXXX'
}

export const PhoneNumberBase = {
  isE164Number,
}
