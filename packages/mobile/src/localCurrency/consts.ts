// Supported local currency codes
export enum LocalCurrencyCode {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  MXN = 'MXN',
  COP = 'COP',
  PHP = 'PHP',
  LRD = 'LRD',
  SLL = 'SLL',
  KES = 'KES',
  UGX = 'UGX',
  GHS = 'GHS',
  NGN = 'NGN',
  BRL = 'BRL',
  CVE = 'CVE',
}

export enum LocalCurrencySymbol {
  USD = '$',
  CAD = '$',
  EUR = '€',
  MXN = '$',
  COP = '$',
  PHP = '₱',
  LRD = 'L$',
  SLL = 'Le',
  KES = 'KSh',
  UGX = 'USh',
  GHS = 'GH₵',
  NGN = '₦',
  BRL = 'R$',
  CVE = '$',
}

export const LOCAL_CURRENCY_CODES = Object.values(LocalCurrencyCode)
