import { keccak256 } from 'web3-utils'
import { Address, ensureLeading0x, trimLeading0x } from './address'

export enum CURRENCY_ENUM {
  GOLD = 'Celo Gold',
  DOLLAR = 'Celo Dollar',
}

interface Currency {
  symbol: string
  code: string
  displayDecimals: number
}

type CurrencyObject = { [key in CURRENCY_ENUM]: Currency }

export const CURRENCIES: CurrencyObject = {
  [CURRENCY_ENUM.GOLD]: {
    symbol: '',
    code: 'cGLD',
    displayDecimals: 3,
  },
  [CURRENCY_ENUM.DOLLAR]: {
    symbol: '$',
    code: 'cUSD',
    displayDecimals: 2,
  },
}

export const resolveCurrency = (label: string): CURRENCY_ENUM => {
  if (label && label.toLowerCase().includes('dollar')) {
    return CURRENCY_ENUM.DOLLAR
  } else if (label && label.toLowerCase().includes('gold')) {
    return CURRENCY_ENUM.GOLD
  } else {
    console.info('Unable to resolve currency from label: ' + label)
    return CURRENCY_ENUM.DOLLAR
  }
}

export enum SHORT_CURRENCIES {
  DOLLAR = 'dollar',
  GOLD = 'gold',
}

export const currencyToShortMap = {
  [CURRENCY_ENUM.DOLLAR]: SHORT_CURRENCIES.DOLLAR,
  [CURRENCY_ENUM.GOLD]: SHORT_CURRENCIES.GOLD,
}

/**
 * Used to construct the pair identifier from a pair label (e.g. CELO/BTC)
 * The pair identifier needs to be a valid ethereum address, thus we
 * truncate the last 20 bytes (12-32) of the keccak of the pair label.
 * @param pair a string
 */
export const oracleCurrencyPairIdentifier = (pair: string): Address => {
  const hash = Buffer.from(trimLeading0x(keccak256(pair)), 'hex')
  return ensureLeading0x(hash.slice(12, 32).toString('hex'))
}
