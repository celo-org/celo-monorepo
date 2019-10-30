import CountryData from 'country-data'

export default {
  callingCountries: {
    all: [
      { name: 'USA', countryCallingCodes: ['1'], alpha2: 'US' },
      { name: 'UK', countryCallingCodes: ['33'], alpha2: 'GB' },
    ],
  },
  lookup: CountryData.lookup,
}
