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

const currencyTranslationsENUS: { [key: string]: string } = {
  CeloDollars: 'Celo Dollars',
  CeloDollar: 'Celo Dollar',
  Dollar: 'Dollar',
  Dollars: 'Dollars',
  dollars: 'dollars',
}
const currencyTranslationsESAR: { [key: string]: string } = {
  CeloDollars: 'Celo Dólares',
  CeloDollar: 'Celo Dólar',
  Dollar: 'Dólar',
  Dollars: 'Dólares',
  dollars: 'dólares',
}
export const currencyTranslations: { [key: string]: any } = {
  ['en-US']: currencyTranslationsENUS,
  ['es-419']: currencyTranslationsESAR,
}
