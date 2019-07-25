import { getDisplayPhoneNumber } from './phoneNumbers'

export interface BaseProps {
  validator?: 'phone' | 'integer' | 'decimal' | 'custom'
  customValidator?: (input: string) => string
  countryCallingCode?: string
  lng?: string
}

export function validateInteger(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

export function validateDecimal(input: string, lng?: string): string {
  // Comma decimal points, only supports es right now!
  if (lng && lng.startsWith('es')) {
    // Keep only first decimal
    return input
      .replace(/[^0-9,]/g, '')
      .replace(/,/, 'b')
      .replace(/,/g, '')
      .replace(/b/, ',')
  }

  // Fall back to just period decimals
  return input
    .replace(/[^0-9.]/g, '')
    .replace(/\./, 'b')
    .replace(/\./g, '')
    .replace(/b/, '.')
}

export function validatePhone(input: string, countryCallingCode?: string): string {
  input = input.replace(/[^0-9()\- ]/g, '')

  if (!countryCallingCode) {
    return input
  }

  const displayNumber = getDisplayPhoneNumber(input, countryCallingCode)

  if (!displayNumber) {
    return input
  }

  return displayNumber
}

export function validateInput(input: string, props: BaseProps): string {
  if (!props.validator && !props.customValidator) {
    return input
  }

  switch (props.validator) {
    case 'decimal':
      return validateDecimal(input, props.lng)
    case 'integer':
      return validateInteger(input)
    case 'phone':
      return validatePhone(input, props.countryCallingCode)
    case 'custom': {
      if (props.customValidator) {
        return props.customValidator(input)
      }
    }
  }

  throw new Error('Unhandled input validator')
}
