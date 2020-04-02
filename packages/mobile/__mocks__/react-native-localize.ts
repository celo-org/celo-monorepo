import { NativeModules } from 'react-native'

NativeModules.RNLocalize = {
  initialConstants: {
    locales: [
      {
        languageCode: 'en',
        countryCode: 'US',
        languageTag: 'en-US',
        isRTL: false,
      },
    ],
    currencies: ['MXN', 'USD'],
  },
}

module.exports = {
  ...jest.requireActual('react-native-localize'),
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
}
