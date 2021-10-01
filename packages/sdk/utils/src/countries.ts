import countryData from 'country-data'
// more countries @ https://github.com/umpirsky/country-list
import esData from './data/countries/es/country.json'
import { getExampleNumber } from './phoneNumbers'

interface CountryNames {
  [name: string]: string
}

export interface LocalizedCountry extends Omit<countryData.Country, 'countryCallingCodes'> {
  displayName: string
  displayNameNoDiacritics: string
  names: CountryNames
  countryPhonePlaceholder: {
    national?: string | undefined
    international?: string | undefined
  }
  countryCallingCode: string
}

const removeDiacritics = (word: string) =>
  word &&
  word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const matchCountry = (country: LocalizedCountry, query: string) => {
  return (
    country.displayNameNoDiacritics.startsWith(query) ||
    country.countryCallingCode.startsWith('+' + query) ||
    country.alpha3.startsWith(query.toUpperCase())
  )
}

export class Countries {
  language: string
  countryMap: Map<string, LocalizedCountry>
  localizedCountries: LocalizedCountry[]

  constructor(language?: string) {
    // fallback to 'en-us'
    this.language = language ? language.toLocaleLowerCase() : 'en-us'
    this.countryMap = new Map()
    this.localizedCountries = Array()
    this.assignCountries()
  }

  getCountry(countryName?: string | null): LocalizedCountry | undefined {
    if (!countryName) {
      return undefined
    }

    const query = removeDiacritics(countryName)

    return this.localizedCountries.find((country) => country.displayNameNoDiacritics === query)
  }

  getCountryByCodeAlpha2(countryCode: string): LocalizedCountry | undefined {
    return this.countryMap.get(countryCode)
  }

  getFilteredCountries(query: string): LocalizedCountry[] {
    query = removeDiacritics(query)
    // Return full list if the query is empty
    if (!query || !query.length) {
      return this.localizedCountries
    }

    return this.localizedCountries.filter((country) => matchCountry(country, query))
  }

  private assignCountries() {
    // add other languages to country data
    this.localizedCountries = countryData.callingCountries.all
      .map((country: countryData.Country) => {
        // this is assuming these two are the only cases, in i18n.ts seems like there
        // are fallback languages 'es-US' and 'es-LA' that are not covered
        const names: CountryNames = {
          'en-us': country.name,
          // @ts-ignore
          'es-419': esData[country.alpha2],
        }

        const displayName = names[this.language] || country.name

        // We only use the first calling code, others are irrelevant in the current dataset.
        // Also some of them have a non standard calling code
        // for instance: 'Antigua And Barbuda' has '+1 268', where only '+1' is expected
        // so we fix this here
        const countryCallingCode = country.countryCallingCodes[0].split(' ')[0]

        const localizedCountry = {
          names,
          displayName,
          displayNameNoDiacritics: removeDiacritics(displayName),
          countryPhonePlaceholder: {
            national: getExampleNumber(countryCallingCode),
            // Not needed right now
            // international: getExampleNumber(countryCallingCode, true, true),
          },
          countryCallingCode,
          ...country,
          // Use default emoji when flag emoji is missing
          emoji: country.emoji || '🏳',
        }

        // use ISO 3166-1 alpha2 code as country id
        this.countryMap.set(country.alpha2.toUpperCase(), localizedCountry)

        return localizedCountry
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }
}
