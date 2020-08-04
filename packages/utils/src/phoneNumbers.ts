import CountryData from 'country-data'
import {
  CountryCode,
  getCountries,
  getExampleNumber as libGetExampleNumber,
  parsePhoneNumber as libParsePhoneNumber,
  parsePhoneNumberFromString,
  PhoneNumber,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import * as Web3Utils from 'web3-utils'
import { getIdentifierPrefix, IdentifierType } from './attestations'

export interface ParsedPhoneNumber {
  e164Number: string
  displayNumber: string
  displayNumberInternational: string
  countryCode?: number
  regionCode?: string
}

const MIN_PHONE_LENGTH = 4
const PHONE_SALT_SEPARATOR = '__'
const E164_REGEX = /^\+[1-9][0-9]{1,14}$/

export function getCountryEmoji(
  e164PhoneNumber: string,
  countryCodePossible?: number,
  regionCodePossible?: string
) {
  // The country code and region code can both be passed in, or it can be inferred from the e164PhoneNumber
  let countryCode: any
  let regionCode: any
  countryCode = countryCodePossible
  regionCode = regionCodePossible
  if (!countryCode || !regionCode) {
    countryCode = getCountryCode(e164PhoneNumber)
    regionCode = getRegionCode(e164PhoneNumber)
  }
  const countries = CountryData.lookup.countries({ countryCallingCodes: `+${countryCode}` })
  const userCountryArray = countries.filter((c: any) => c.alpha2 === regionCode)
  const country = userCountryArray.length > 0 ? userCountryArray[0] : undefined

  return country ? country.emoji : ''
}

export const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  if (!phoneNumber || !isE164Number(phoneNumber)) {
    throw Error('Attempting to hash a non-e164 number: ' + phoneNumber)
  }
  const prefix = getIdentifierPrefix(IdentifierType.PHONE_NUMBER)
  const value = prefix + (salt ? phoneNumber + PHONE_SALT_SEPARATOR + salt : phoneNumber)
  return Web3Utils.soliditySha3({ type: 'string', value })
}

export function getCountryCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    // type CountryCallingCode is an extension of String, but
    // type checks fail when attempting to pass it as a parameter for parseInt,
    // so here we force the string representation, and then parse it to a number
    const callingCode = parsePhoneNumberFromString(e164PhoneNumber)?.countryCallingCode
    return parseInt(callingCode as string, 10)
  } catch (error) {
    console.debug(`countryCallingCode, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}

export function getRegionCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    const country = parsePhoneNumberFromString(e164PhoneNumber)?.country
    // type CountryCode is an extension of String, but
    // type checks fail when attempting to pass it as a parameter for parseInt,
    // so here we force the string representation
    return country as string
  } catch (error) {
    console.debug(`country, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}

function _getRegionCodeFromCountryCode(countryCode: string | undefined): CountryCode | null {
  if (!countryCode) {
    return null
  }
  const countries = getCountries()
  const regionCode = countries[parseInt(countryCode, 10)]
  return regionCode
}

export function getRegionCodeFromCountryCode(countryCode: string) {
  try {
    const cc = _getRegionCodeFromCountryCode(countryCode)
    if (!cc) {
      return null
    }
    // type CountryCode is an extension of String, but
    // type checks fail when attempting to pass it as a parameter for parseInt,
    // so here we force the string representation
    return cc as string
  } catch (error) {
    console.debug(`getCountries, countrycode: ${countryCode}, error: ${error}`)
    return null
  }
}

export function getDisplayPhoneNumber(phoneNumber: string, defaultCountryCode: string) {
  const phoneDetails = parsePhoneNumber(phoneNumber, defaultCountryCode)
  if (phoneDetails) {
    return phoneDetails.displayNumber
  } else {
    // Fallback to input instead of showing nothing for invalid numbers
    return phoneNumber
  }
}

export function getDisplayNumberInternational(e164PhoneNumber: string) {
  const countryCode = getCountryCode(e164PhoneNumber)
  const phoneDetails = parsePhoneNumber(e164PhoneNumber, (countryCode || '').toString())
  if (phoneDetails) {
    return phoneDetails.displayNumberInternational
  } else {
    // Fallback to input instead of showing nothing for invalid numbers
    return e164PhoneNumber
  }
}

export function getE164DisplayNumber(e164PhoneNumber: string) {
  const countryCode = getCountryCode(e164PhoneNumber)
  return getDisplayPhoneNumber(e164PhoneNumber, (countryCode || '').toString())
}

export function getE164Number(phoneNumber: string, defaultCountryCode: string) {
  const phoneDetails = parsePhoneNumber(phoneNumber, defaultCountryCode)
  if (phoneDetails && isE164Number(phoneDetails.e164Number)) {
    return phoneDetails.e164Number
  } else {
    return null
  }
}

export function isE164Number(phoneNumber: string) {
  return E164_REGEX.test(phoneNumber)
}

// Actually runs through the parsing instead of using a regex
export function isE164NumberStrict(phoneNumber: string) {
  const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber)
  if (!parsedPhoneNumber?.isValid()) {
    return false
  }
  return parsedPhoneNumber.format('E.164') === phoneNumber
}

export function parsePhoneNumber(
  phoneNumberRaw: string,
  defaultCountryCode?: string
): ParsedPhoneNumber | null {
  try {
    if (!phoneNumberRaw || phoneNumberRaw.length < MIN_PHONE_LENGTH) {
      return null
    }

    const defaultRegionCode = _getRegionCodeFromCountryCode(defaultCountryCode)
    const parsedNumberUnfixed = libParsePhoneNumber(phoneNumberRaw, defaultRegionCode || undefined)
    const strParsedCountryCode = parsedNumberUnfixed?.countryCallingCode
    const parsedCountryCode = strParsedCountryCode
      ? parseInt(strParsedCountryCode as string, 10)
      : undefined
    const parsedRegionCode = parsedNumberUnfixed?.country
    const parsedNumber = handleSpecialCasesForParsing(
      parsedNumberUnfixed,
      parsedCountryCode,
      parsedRegionCode
    )

    if (!parsedNumber) {
      return null
    }
    if (!parsedNumber.isValid()) {
      return null
    }
    return {
      e164Number: parsedNumber.format('E.164'),
      displayNumber: handleSpecialCasesForDisplay(parsedNumber, parsedCountryCode),
      displayNumberInternational: parsedNumber.format('INTERNATIONAL'),
      countryCode: parsedCountryCode,
      regionCode: parsedRegionCode as string,
    }
  } catch (error) {
    console.debug(`phoneNumbers/parsePhoneNumber/Failed to parse phone number, error: ${error}`)
    return null
  }
}

function handleSpecialCasesForParsing(
  parsedNumber: PhoneNumber,
  countryCode?: number,
  regionCode?: CountryCode
) {
  if (!countryCode || !regionCode) {
    return parsedNumber
  }

  switch (countryCode) {
    // Argentina
    // https://github.com/googlei18n/libphonenumber/blob/master/FAQ.md#why-is-this-number-from-argentina-ar-or-mexico-mx-not-identified-as-the-right-number-type
    // https://en.wikipedia.org/wiki/Telephone_numbers_in_Argentina
    case 54:
      return prependToFormMobilePhoneNumber(parsedNumber, regionCode, '9')

    default:
      return parsedNumber
  }
}

// TODO(Rossy) Given the inconsistencies of numbers around the world, we should
// display e164 everywhere to ensure users knows exactly who their sending money to
function handleSpecialCasesForDisplay(parsedNumber: PhoneNumber, countryCode?: number): string {
  switch (countryCode) {
    // Argentina
    // The Google lib formatter incorretly adds '15' to the nationally formatted number for Argentina
    // However '15' is only needed when calling a mobile from a landline
    case 54:
      return parsedNumber.format('INTERNATIONAL').replace(/\+54(\s)?/, '')

    case 231:
      const formatted = parsedNumber.format('NATIONAL')
      return formatted && formatted[0] === '0' ? formatted.slice(1) : formatted

    default:
      return parsedNumber.format('NATIONAL')
  }
}

/**
 * Some countries require a prefix before the area code depending on if the number is
 * mobile vs landline and international vs national
 */
function prependToFormMobilePhoneNumber(
  parsedNumber: PhoneNumber,
  regionCode: CountryCode,
  prefix: string
) {
  if (parsedNumber.getType() === 'MOBILE') {
    return parsedNumber
  }

  let nationalNumber = parsedNumber.format('NATIONAL')
  // Nationally formatted numbers sometimes contain leading 0
  if (nationalNumber.charAt(0) === '0') {
    nationalNumber = nationalNumber.slice(1)
  }
  // If the number already starts with prefix, don't prepend it again
  if (nationalNumber.startsWith(prefix)) {
    return null
  }

  const adjustedNumber = libParsePhoneNumber(prefix + nationalNumber, regionCode)
  return adjustedNumber.getType() === 'MOBILE' ? adjustedNumber : null
}

export function anonymizedPhone(phoneNumber: string) {
  return phoneNumber.slice(0, -4) + 'XXXX'
}

export function getExampleNumber(
  regionCode: string,
  useOnlyZeroes: boolean = true,
  isInternational: boolean = false
) {
  const cc = _getRegionCodeFromCountryCode(regionCode)
  if (!cc) {
    return
  }
  const examplePhone = libGetExampleNumber(cc, examples)

  if (!examplePhone) {
    return
  }

  const formatedExample = examplePhone.format(isInternational ? 'INTERNATIONAL' : 'NATIONAL')

  if (useOnlyZeroes) {
    if (isInternational) {
      return formatedExample.replace(/(^\+[0-9]{1,3} |[0-9])/g, (value, _, i) => (i ? '0' : value))
    }
    return formatedExample.replace(/[0-9]/g, '0')
  }

  return formatedExample
}

export const PhoneNumberUtils = {
  getPhoneHash,
  getCountryCode,
  getRegionCode,
  getDisplayPhoneNumber,
  getE164Number,
  isE164Number,
  parsePhoneNumber,
}
