import { Countries } from '../src/countries'

const countries = new Countries('en-us')

describe('countries', () => {
  describe('getCountryMap', () => {
    it('Valid Country', () => {
      const country = countries.getCountryByCode('US')

      expect(country).toBeDefined()

      // check these to make tsc happy
      if (country && country.names) {
        expect(country.names['en-us']).toEqual('United States')
      }
    })

    it('Invalid Country', () => {
      // canary islands, no calling code
      const invalidCountry = countries.getCountryByCode('IC')

      // should be a LocalizedCountry but all fields empty / default
      const emptyCountry = {
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

      expect(invalidCountry).toMatchObject(emptyCountry)
    })
  })
  describe('getLocalizedCountries', () => {
    it('has all country data', () => {
      const country = countries.getCountry('taiwan')

      const taiwan = {
        alpha2: 'TW',
        alpha3: 'TWN',
        countryCallingCodes: ['+886'],
        currencies: ['TWD'],
        emoji: '🇹🇼',
        ioc: 'TPE',
        languages: ['zho'],
        name: 'Taiwan',
        displayName: 'Taiwan',
        status: 'assigned',
        names: { 'en-us': 'Taiwan', 'es-ar': 'Taiwán' },
      }

      expect(country).toMatchObject(taiwan)
    })
  })

  describe('Country Search', () => {
    it('returns empty array on exact match', () => {
      const results = countries.getFilteredCountries('taiwan')

      expect(results.length).toBe(0)
    })
  })
})
