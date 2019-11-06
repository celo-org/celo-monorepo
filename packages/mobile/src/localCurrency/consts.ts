// Supported local currency codes
export enum LocalCurrencyCode {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  MXN = 'MXN',
  PHP = 'PHP',
  LRD = 'LRD',
}

export enum LocalCurrencySymbol {
  USD = '$',
  CAD = '$',
  EUR = '€',
  MXN = '$',
  PHP = '₱',
  LRD = 'L$',
}

export const LOCAL_CURRENCY_CODES = Object.values(LocalCurrencyCode)
