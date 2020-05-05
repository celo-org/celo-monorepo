import CountryData from 'country-data'
import {
  PhoneNumber,
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil,
} from 'google-libphonenumber'
import * as Web3Utils from 'web3-utils'

export interface ParsedPhoneNumber {
  e164Number: string
  displayNumber: string
  countryCode?: number
  regionCode?: string
}

const phoneUtil = PhoneNumberUtil.getInstance()
const MIN_PHONE_LENGTH = 4
const PHONE_SALT_SEPARATOR = '__'

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

  return (country ? country.emoji : '') + ` +${countryCode}`
}

export const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  if (!phoneNumber || !isE164Number(phoneNumber)) {
    throw Error('Attempting to hash a non-e164 number: ' + phoneNumber)
  }
  // TODO re-enable when we turn on phone-number-privacy everywhere
  // const prefix = getIdentifierPrefix(IdentifierType.PHONE_NUMBER)
  const value = salt ? phoneNumber + PHONE_SALT_SEPARATOR + salt : phoneNumber
  return Web3Utils.soliditySha3({ type: 'string', value })
}

export function getCountryCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    return phoneUtil.parse(e164PhoneNumber).getCountryCode()
  } catch (error) {
    console.debug(`getCountryCode, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}

export function getRegionCode(e164PhoneNumber: string) {
  if (!e164PhoneNumber) {
    return null
  }
  try {
    return phoneUtil.getRegionCodeForNumber(phoneUtil.parse(e164PhoneNumber))
  } catch (error) {
    console.debug(`getRegionCodeForNumber, number: ${e164PhoneNumber}, error: ${error}`)
    return null
  }
}

export function getRegionCodeFromCountryCode(countryCode: string) {
  if (!countryCode) {
    return null
  }
  try {
    return phoneUtil.getRegionCodeForCountryCode(parseInt(countryCode, 10))
  } catch (error) {
    console.debug(`getRegionCodeFromCountryCode, countrycode: ${countryCode}, error: ${error}`)
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
  const E164RegEx = /^\+[1-9][0-9]{1,14}$/
  return E164RegEx.test(phoneNumber)
}

// Actually runs through the parsing instead of using a regex
export function isE164NumberStrict(phoneNumber: string) {
  const parsedPhoneNumber = phoneUtil.parse(phoneNumber)
  if (!phoneUtil.isValidNumber(parsedPhoneNumber)) {
    return false
  }
  return phoneUtil.format(parsedPhoneNumber, PhoneNumberFormat.E164) === phoneNumber
}

export function parsePhoneNumber(
  phoneNumberRaw: string,
  defaultCountryCode: string
): ParsedPhoneNumber | null {
  try {
    if (!phoneNumberRaw || phoneNumberRaw.length < MIN_PHONE_LENGTH) {
      return null
    }

    const defaultRegionCode = getRegionCodeFromCountryCode(defaultCountryCode)
    const parsedNumberUnfixed = phoneUtil.parse(phoneNumberRaw, defaultRegionCode || undefined)
    const parsedCountryCode = parsedNumberUnfixed.getCountryCode()
    const parsedRegionCode = phoneUtil.getRegionCodeForNumber(parsedNumberUnfixed)
    const parsedNumber = handleSpecialCasesForParsing(
      parsedNumberUnfixed,
      parsedCountryCode,
      parsedRegionCode
    )

    if (!parsedNumber) {
      return null
    }

    const isValid = phoneUtil.isValidNumberForRegion(parsedNumber, parsedRegionCode)

    return isValid
      ? {
          e164Number: phoneUtil.format(parsedNumber, PhoneNumberFormat.E164),
          displayNumber: handleSpecialCasesForDisplay(parsedNumber, parsedCountryCode),
          countryCode: parsedCountryCode,
          regionCode: parsedRegionCode,
        }
      : null
  } catch (error) {
    console.debug(`phoneNumbers/parsePhoneNumber/Failed to parse phone number, error: ${error}`)
    return null
  }
}

function handleSpecialCasesForParsing(
  parsedNumber: PhoneNumber,
  countryCode?: number,
  regionCode?: string
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
function handleSpecialCasesForDisplay(parsedNumber: PhoneNumber, countryCode?: number) {
  switch (countryCode) {
    // Argentina
    // The Google lib formatter incorretly adds '15' to the nationally formatted number for Argentina
    // However '15' is only needed when calling a mobile from a landline
    case 54:
      return phoneUtil
        .format(parsedNumber, PhoneNumberFormat.INTERNATIONAL)
        .replace(/\+54(\s)?/, '')

    case 231:
      const formatted = phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL)
      return formatted && formatted[0] === '0' ? formatted.slice(1) : formatted

    default:
      return phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL)
  }
}

/**
 * Some countries require a prefix before the area code depending on if the number is
 * mobile vs landline and international vs national
 */
function prependToFormMobilePhoneNumber(
  parsedNumber: PhoneNumber,
  regionCode: string,
  prefix: string
) {
  if (phoneUtil.getNumberType(parsedNumber) === PhoneNumberType.MOBILE) {
    return parsedNumber
  }

  let nationalNumber = phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL)
  // Nationally formatted numbers sometimes contain leading 0
  if (nationalNumber.charAt(0) === '0') {
    nationalNumber = nationalNumber.slice(1)
  }
  // If the number already starts with prefix, don't prepend it again
  if (nationalNumber.startsWith(prefix)) {
    return null
  }

  const adjustedNumber = phoneUtil.parse(prefix + nationalNumber, regionCode)
  return phoneUtil.getNumberType(adjustedNumber) === PhoneNumberType.MOBILE ? adjustedNumber : null
}

export function anonymizedPhone(phoneNumber: string) {
  return phoneNumber.slice(0, -4) + 'XXXX'
}

export function getExampleNumber(
  regionCode: string,
  useOnlyZeroes: boolean = true,
  isInternational: boolean = false
) {
  const examplePhone = phoneUtil.getExampleNumber(
    getRegionCodeFromCountryCode(regionCode) as string
  )

  if (!examplePhone) {
    return
  }

  const formatedExample = phoneUtil.format(
    examplePhone,
    isInternational ? PhoneNumberFormat.INTERNATIONAL : PhoneNumberFormat.NATIONAL
  )

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
