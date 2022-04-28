/** @deprecated use StableToken and Token */
export enum CURRENCY_ENUM {
  GOLD = 'Celo Gold',
  DOLLAR = 'Celo Dollar',
  EURO = 'Celo Euro',
}

export enum StableToken {
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  cREAL = 'cREAL',
}

export enum Token {
  CELO = 'CELO',
}

export type CeloTokenType = StableToken | Token

interface Currency {
  symbol: string
  code: string
  displayDecimals: number
}

type CurrencyObject = { [key in CURRENCY_ENUM]: Currency }

/** @deprecated */
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
  [CURRENCY_ENUM.EURO]: {
    symbol: '€',
    code: 'cEUR',
    displayDecimals: 2,
  },
}

export const resolveCurrency = (label: string): CURRENCY_ENUM => {
  if (label && label.toLowerCase().includes('dollar')) {
    return CURRENCY_ENUM.DOLLAR
  } else if (label && label.toLowerCase().includes('euro')) {
    return CURRENCY_ENUM.EURO
  } else if (label && label.toLowerCase().includes('gold')) {
    return CURRENCY_ENUM.GOLD
  } else {
    console.info('Unable to resolve currency from label: ' + label)
    return CURRENCY_ENUM.DOLLAR
  }
}

/** @deprecated use StableToken and Token */
export enum SHORT_CURRENCIES {
  DOLLAR = 'dollar',
  GOLD = 'gold',
  EURO = 'euro',
}

/** @deprecated use StableToken and Token */
export const currencyToShortMap = {
  [CURRENCY_ENUM.DOLLAR]: SHORT_CURRENCIES.DOLLAR,
  [CURRENCY_ENUM.GOLD]: SHORT_CURRENCIES.GOLD,
  [CURRENCY_ENUM.EURO]: SHORT_CURRENCIES.EURO,
}
