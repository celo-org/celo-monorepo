export enum LocalCurrencyCode {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  MXN = 'MXN',
  PHP = 'PHP',
}

export const BASE_CURRENCY = LocalCurrencyCode.USD
// This API reads from daily European Central Bank exchange rate data
export const EXCHANGE_RATES_API = 'https://api.exchangeratesapi.io'
// Currencies available from above API as of 10/24/2019
export const AVAILABLE_CURRENCIES = [
  'CAD',
  'EUR',
  'HKD',
  'ISK',
  'PHP',
  'DKK',
  'HUF',
  'CZK',
  'AUD',
  'RON',
  'SEK',
  'IDR',
  'INR',
  'BRL',
  'RUB',
  'HRK',
  'JPY',
  'THB',
  'CHF',
  'SGD',
  'PLN',
  'BGN',
  'TRY',
  'CNY',
  'NOK',
  'NZD',
  'ZAR',
  'USD',
  'MXN',
  'ILS',
  'GBP',
  'KRW',
  'MYR',
]
