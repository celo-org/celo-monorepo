import { LocalCurrencyCode } from '@celo/utils/src/currencies'
import * as request from 'request-promise'
import { AVAILABLE_CURRENCIES, BASE_CURRENCY, EXCHANGE_RATES_API } from 'src/currency/consts'
import { writeFiatExchangeRatePair } from '../firebase'

const currenciesDesired = Object.values(LocalCurrencyCode)
const currenciesToQuery = currenciesDesired.filter((currency) =>
  AVAILABLE_CURRENCIES.includes(currency)
)

export function ensureDesiredCurrenciesAvailable() {
  if (currenciesDesired.length !== currenciesToQuery.length) {
    const missingCurrencies = currenciesDesired.filter(
      (currency) => AVAILABLE_CURRENCIES.indexOf(currency) < 0
    )
    console.error(`Warning: Cannot fetch currencies ${missingCurrencies} from specified API.`)
  }
}

export async function handleFiatExchangeQuery() {
  const fetchTime = new Date()
  const rates = await queryFiatExchangeRates(fetchTime)

  for (const currency of Object.values(LocalCurrencyCode)) {
    writeFiatExchangeRatePair(
      LocalCurrencyCode.USD,
      currency,
      rates[currency].toString(),
      fetchTime.toString()
    )
  }
}

// Returns date string in YYYY-MM-DD
export function formatDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

async function queryFiatExchangeRates(date: Date) {
  console.debug('Querying exchange rate', date)
  const path = `/${formatDateString(date)}`
  const options = {
    uri: EXCHANGE_RATES_API + path,
    qs: {
      base: BASE_CURRENCY,
      symbols: currenciesToQuery.toString(),
    },
    headers: {
      'User-Agent': 'Request-Promise',
    },
    json: true, // Automatically parses the JSON string in the response
  }
  const result = await request(options)
  console.debug('Retrieved rates', result.rates)
  return result.rates
}
