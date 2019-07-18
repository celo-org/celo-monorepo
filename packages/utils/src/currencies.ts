export enum CURRENCY_ENUM {
  GOLD = 'Celo Gold',
  DOLLAR = 'Celo Dollar',
}

interface Currency {
  singleUnit: string
  pluralUnit: string
  symbol: string
  code: string
}

type CurrencyObject = { [key in CURRENCY_ENUM]: Currency }

export const CURRENCIES: CurrencyObject = {
  [CURRENCY_ENUM.GOLD]: {
    singleUnit: 'Celo gold',
    pluralUnit: 'Celo gold',
    symbol: '',
    code: 'cGLD',
  },
  [CURRENCY_ENUM.DOLLAR]: {
    singleUnit: 'Celo dollar',
    pluralUnit: 'Celo dollars',
    symbol: '$',
    code: 'cUSD',
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
