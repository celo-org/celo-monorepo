export enum CURRENCY_ENUM {
  GOLD = 'Celo Gold',
  DOLLAR = 'Celo Dollar',
  EURO = 'Celo Euro',
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

export enum SHORT_CURRENCIES {
  DOLLAR = 'dollar',
  GOLD = 'gold',
  EURO = 'euro',
}

export const currencyToShortMap = {
  [CURRENCY_ENUM.DOLLAR]: SHORT_CURRENCIES.DOLLAR,
  [CURRENCY_ENUM.GOLD]: SHORT_CURRENCIES.GOLD,
  [CURRENCY_ENUM.EURO]: SHORT_CURRENCIES.EURO,
}
