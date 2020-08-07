import { getIdentifierPrefix, IdentifierType } from './attestations'

export interface ParsedPhoneNumber {
  e164Number: string
  displayNumber: string
  displayNumberInternational: string
  countryCode?: number
  regionCode?: string
}

const PHONE_SALT_SEPARATOR = '__'
const E164_REGEX = /^\+[1-9][0-9]{1,14}$/

export const getPhoneHash = (
  sha3: (a: string) => string | null,
  phoneNumber: string,
  salt?: string
): string => {
  if (!phoneNumber || !isE164Number(phoneNumber)) {
    throw Error('Attempting to hash a non-e164 number: ' + phoneNumber)
  }
  const prefix = getIdentifierPrefix(IdentifierType.PHONE_NUMBER)
  const value = prefix + (salt ? phoneNumber + PHONE_SALT_SEPARATOR + salt : phoneNumber)
  return sha3(value) as string
}

export function isE164Number(phoneNumber: string) {
  return E164_REGEX.test(phoneNumber)
}

export function anonymizedPhone(phoneNumber: string) {
  return phoneNumber.slice(0, -4) + 'XXXX'
}

export const PhoneNumberBase = {
  getPhoneHash,
  isE164Number,
}
