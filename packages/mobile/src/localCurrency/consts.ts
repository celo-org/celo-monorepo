// Supported local currency codes
export enum LocalCurrencyCode {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  MXN = 'MXN',
  PHP = 'PHP',
  LRD = 'LRD',
  SLL = 'SLL',
  KES = 'KES',
  UGX = 'UGX',
  GHS = 'GHS',
  NGN = 'NGN',
}

export enum LocalCurrencySymbol {
  USD = '$',
  CAD = '$',
  EUR = '€',
  MXN = '$',
  PHP = '₱',
  LRD = 'L$',
  SLL = 'Le',
  KES = 'KSh',
  UGX = 'USh',
  GHS = 'GH₵',
  NGN = '₦',
}

export const LOCAL_CURRENCY_CODES = Object.values(LocalCurrencyCode)
