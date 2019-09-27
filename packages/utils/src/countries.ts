const esData = require('@umpirsky/country-list/data/es/country.json')
import countryData from 'country-data'
import { notEmpty } from './collections'

interface CountryNames {
  [name: string]: string
}

export interface LocalizedCountry extends countryData.Country {
  displayName: string
  names: CountryNames
}

const EMPTY_COUNTRY: LocalizedCountry = {
  alpha2: '',
  alpha3: '',
  countryCallingCodes: [],
  currencies: [],
  displayName: '',
  emoji: '',
  ioc: '',
  languages: [],
  name: '',
  names: {},
  status: '',
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

  getCountryByPhoneCountryCode(countryCode: string): LocalizedCountry {
    if (!countryCode) {
      return EMPTY_COUNTRY
    }

    const country = this.localizedCountries.find(
      (c: LocalizedCountry) => c.countryCallingCodes && c.countryCallingCodes.includes(countryCode)
    )

    return country || EMPTY_COUNTRY
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

        const localizedCountry = {
          names,
          displayName: names[this.language],
          ...country,
        }

        // use ISO 3166-1 alpha2 code as country id
        this.countryMap.set(country.alpha2.toUpperCase(), localizedCountry)

        return localizedCountry
      }
    )

    this.countriesWithNoDiacritics = this.localizedCountries.map((country: LocalizedCountry) => ({
      displayName: removeDiacritics(country.displayName),
      countryCode: country.countryCallingCodes[0],
    }))
  }
}
