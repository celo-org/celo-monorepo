import { Countries } from './countries'

const countries = new Countries('en-us')

describe('countries', () => {
  describe('getCountryMap', () => {
    test('Valid Country', () => {
      const country = countries.getCountryByCodeAlpha2('US')

      expect(country).toBeDefined()

      // check these to make tsc happy
      if (country && country.names) {
        expect(country.names['en-us']).toEqual('United States')
      }
    })

    test('Invalid Country', () => {
      // canary islands, no calling code
      const invalidCountry = countries.getCountryByCodeAlpha2('IC')

      expect(invalidCountry).toBeUndefined()
    })
  })
  describe('getCountry', () => {
    test('has all country data', () => {
      const country = countries.getCountry('taiwan')

      expect(country).toMatchInlineSnapshot(`
        Object {
          "alpha2": "TW",
          "alpha3": "TWN",
          "countryCallingCode": "+886",
          "countryCallingCodes": Array [
            "+886",
          ],
          "countryPhonePlaceholder": Object {
            "national": "00 0000 0000",
          },
          "currencies": Array [
            "TWD",
          ],
          "displayName": "Taiwan",
          "displayNameNoDiacritics": "taiwan",
          "emoji": "🇹🇼",
          "ioc": "TPE",
          "languages": Array [
            "zho",
          ],
          "name": "Taiwan",
          "names": Object {
            "en-us": "Taiwan",
            "es-419": "Taiwán",
          },
          "status": "assigned",
        }
      `)
    })
  })

  describe('Country Search', () => {
    test('finds an exact match', () => {
      const results = countries.getFilteredCountries('taiwan')

      expect(results).toMatchInlineSnapshot(`
        Array [
          Object {
            "alpha2": "TW",
            "alpha3": "TWN",
            "countryCallingCode": "+886",
            "countryCallingCodes": Array [
              "+886",
            ],
            "countryPhonePlaceholder": Object {
              "national": "00 0000 0000",
            },
            "currencies": Array [
              "TWD",
            ],
            "displayName": "Taiwan",
            "displayNameNoDiacritics": "taiwan",
            "emoji": "🇹🇼",
            "ioc": "TPE",
            "languages": Array [
              "zho",
            ],
            "name": "Taiwan",
            "names": Object {
              "en-us": "Taiwan",
              "es-419": "Taiwán",
            },
            "status": "assigned",
          },
        ]
      `)
    })

    test('finds countries by calling code', () => {
      const results = countries.getFilteredCountries('49')

      expect(results).toMatchInlineSnapshot(`
        Array [
          Object {
            "alpha2": "DE",
            "alpha3": "DEU",
            "countryCallingCode": "+49",
            "countryCallingCodes": Array [
              "+49",
            ],
            "countryPhonePlaceholder": Object {
              "national": "000 000000",
            },
            "currencies": Array [
              "EUR",
            ],
            "displayName": "Germany",
            "displayNameNoDiacritics": "germany",
            "emoji": "🇩🇪",
            "ioc": "GER",
            "languages": Array [
              "deu",
            ],
            "name": "Germany",
            "names": Object {
              "en-us": "Germany",
              "es-419": "Alemania",
            },
            "status": "assigned",
          },
        ]
      `)
    })

    test('finds countries by ISO code', () => {
      const results = countries.getFilteredCountries('gb')

      expect(results).toMatchInlineSnapshot(`
        Array [
          Object {
            "alpha2": "GB",
            "alpha3": "GBR",
            "countryCallingCode": "+44",
            "countryCallingCodes": Array [
              "+44",
            ],
            "countryPhonePlaceholder": Object {
              "national": "0000 000 0000",
            },
            "currencies": Array [
              "GBP",
            ],
            "displayName": "United Kingdom",
            "displayNameNoDiacritics": "united kingdom",
            "emoji": "🇬🇧",
            "ioc": "GBR",
            "languages": Array [
              "eng",
              "cor",
              "gle",
              "gla",
              "cym",
            ],
            "name": "United Kingdom",
            "names": Object {
              "en-us": "United Kingdom",
              "es-419": "Reino Unido",
            },
            "status": "assigned",
          },
        ]
      `)
    })
  })
})
