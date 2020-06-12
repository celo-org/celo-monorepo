import countryData from 'country-data'
import { notEmpty } from './collections'
import { getExampleNumber } from './phoneNumbers'
const esData = require('@umpirsky/country-list/data/es/country.json')

interface CountryNames {
  [name: string]: string
}

export interface LocalizedCountry extends Omit<countryData.Country, 'countryCallingCodes'> {
  displayName: string
  names: CountryNames
  countryPhonePlaceholder: {
    national?: string | undefined
    international?: string | undefined
  }
  countryCallingCode: string
}

const EMPTY_COUNTRY: LocalizedCountry = {
  alpha2: '',
  alpha3: '',
  countryCallingCode: '',
  currencies: [],
  displayName: '',
  emoji: '',
  ioc: '',
  languages: [],
  name: '',
  names: {},
  status: '',
  countryPhonePlaceholder: { national: '', international: '' },
}

const removeDiacritics = (word: string) =>
  word &&
  word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

interface CountrySearch {
  displayName: string
  countryCode: string
}

const matchCountry = (country: CountrySearch, query: string) => {
  return (
    country &&
    ((country.displayName && country.displayName.startsWith(query)) ||
      country.countryCode.startsWith('+' + query))
  )
}

export class Countries {
  language: string
  countryMap: Map<string, LocalizedCountry>
  localizedCountries: LocalizedCountry[]
  countriesWithNoDiacritics: CountrySearch[]

  constructor(language?: string) {
    // fallback to 'en-us'
    this.language = language ? language.toLocaleLowerCase() : 'en-us'
    this.countryMap = new Map()
    this.localizedCountries = Array()
    this.countriesWithNoDiacritics = Array()
    this.assignCountries()
  }

  getCountry(countryName?: string | null): LocalizedCountry {
    if (!countryName) {
      return EMPTY_COUNTRY
    }

    const query = removeDiacritics(countryName)

    // also ignoring EU and FX here, only two missing
    const countryIndex = this.countriesWithNoDiacritics.findIndex(
      (country) => country.displayName === query
    )

    return countryIndex !== -1 ? this.localizedCountries[countryIndex] : EMPTY_COUNTRY
  }

  getCountryByCode(countryCode: string): LocalizedCountry {
    const country = this.countryMap.get(countryCode)

    return country || EMPTY_COUNTRY
  }

  getFilteredCountries(query: string): string[] {
    query = removeDiacritics(query)
    // Return empty list if the query is empty or matches a country exactly
    // This is necessary to hide the autocomplete window on country select
    if (!query || !query.length) {
      return []
    }

    const exactMatch = this.countriesWithNoDiacritics.find(
      (country) => country.displayName === query
    )

    // since we no longer have the country name as the map key, we have to
    // return empty list if the search result is an exact match to hide the autocomplete window
    if (exactMatch) {
      return []
    }

    // ignoring countries without a provided translation, only ones are
    // EU (European Union) and FX (France, Metropolitan) which don't seem to be used?
    return this.countriesWithNoDiacritics
      .map((country, index) => {
        if (matchCountry(country, query)) {
          return index
        } else {
          return null
        }
      })
      .filter(notEmpty)
      .map((countryIndex: number) => this.localizedCountries[countryIndex].alpha2)
  }

  private assignCountries() {
    // add other languages to country data
    this.localizedCountries = countryData.callingCountries.all.map(
      (country: countryData.Country) => {
        // this is assuming these two are the only cases, in i18n.ts seems like there
        // are fallback languages 'es-US' and 'es-LA' that are not covered
        const names: CountryNames = {
          'en-us': country.name,
          'es-419': esData[country.alpha2],
        }

        // We only use the first calling code, others are irrelevant in the current dataset.
        // Also some one them have a non standard calling code
        // for instance: 'Antigua And Barbuda' has '+1 268', where only '+1' is expected
        // so we fix this here
        const countryCallingCode = country.countryCallingCodes[0].split(' ')[0]

        const localizedCountry = {
          names,
          displayName: names[this.language],
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
      }
    )

    this.countriesWithNoDiacritics = this.localizedCountries.map((country: LocalizedCountry) => ({
      displayName: removeDiacritics(country.displayName),
      countryCode: country.countryCallingCode,
    }))
  }
}
