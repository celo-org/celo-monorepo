import CountryData from 'country-data'

export default {
  callingCountries: {
    all: [
      { name: 'USA', countryCallingCodes: ['+1'], alpha2: 'US' },
      { name: 'Canada', countryCallingCodes: ['+1'], alpha2: 'CA' },
      { name: 'UK', countryCallingCodes: ['+33'], alpha2: 'GB' },
      { name: 'Germany', countryCallingCodes: ['+49'], alpha2: 'DE' },
    ],
  },
  lookup: CountryData.lookup,
}
