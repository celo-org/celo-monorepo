import CountryData from 'country-data'
import { getCountryCode, getRegionCode } from './phoneNumbers'

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
