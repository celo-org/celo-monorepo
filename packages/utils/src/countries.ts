const esData = require('@umpirsky/country-list/data/es_AR/country.json')
import countryData from 'country-data'

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

  private assignCountries() {
    // add other languages to country data
    this.localizedCountries = countryData.callingCountries.all.map(
      (country: countryData.Country) => {
        // this is assuming these two are the only cases, in i18n.ts seems like there
        // are fallback languages 'es-US' and 'es-LA' that are not covered
        const names: CountryNames = {
          'en-us': country.name,
          'es-ar': esData[country.alpha2],
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
  }

  getCountry(countryName?: string | null): LocalizedCountry {
    if (!countryName) {
      return EMPTY_COUNTRY
    }

    // also ignoring EU and FX here, only two missing
    const country = this.localizedCountries.find(
      (c: LocalizedCountry) =>
        c.names !== undefined &&
        c.names[this.language] !== undefined &&
        c.names[this.language].toLowerCase() === countryName.toLowerCase()
    )

    return country || EMPTY_COUNTRY
  }

  getCountryByCode(countryCode: string): LocalizedCountry {
    const country = this.countryMap.get(countryCode)

    return country || EMPTY_COUNTRY
  }

  getFilteredCountries(query: string): string[] {
    query = query.toLowerCase()
    // Return empty list if the query is empty or matches a country exactly
    // This is necessary to hide the autocomplete window on country select
    if (!query || !query.length) {
      return []
    }

    const lng = this.language

    const exactMatch = this.localizedCountries.find(
      (c: LocalizedCountry) =>
        c.names && c.names[lng] !== undefined && c.names[lng].toLowerCase() === query.toLowerCase()
    )

    // since we no longer have the country name as the map key, we have to
    // return empty list if the search result is an exact match to hide the autocomplete window
    if (exactMatch) {
      return []
    }

    // ignoring countries without a provided translation, only ones are
    // EU (European Union) and FX (France, Metropolitan) which don't seem to be used?
    return this.localizedCountries
      .filter(
        (c: LocalizedCountry) =>
          c.names && c.names[lng] !== undefined && c.names[lng].toLowerCase().startsWith(query)
      )
      .map((c: LocalizedCountry) => c.alpha2)
  }
}
