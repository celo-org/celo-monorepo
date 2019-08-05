import { getDisplayPhoneNumber } from './phoneNumbers'

export enum ValidatorKind {
  Custom = 'custom',
  Decimal = 'decimal',
  Integer = 'integer',
  Phone = 'phone',
}

export interface BaseProps {
  validator?: ValidatorKind
  customValidator?: (input: string) => string
  countryCallingCode?: string
  lng?: string
}

export function validateInteger(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

export function validateDecimal(input: string, lng?: string): string {
  // Comma decimal points -- only supports es right now
  const decimalChar = lng && lng.startsWith('es') ? ',' : '.'
  const regex = decimalChar === ',' ? /[^0-9,]/g : /[^0-9.]/g

  const cleanedArray = input.replace(regex, '').split(decimalChar)

  if (cleanedArray.length <= 1) {
    // Empty string or no decimals
    return cleanedArray.join('')
  } else {
    return cleanedArray.shift() + decimalChar + cleanedArray.join('')
  }
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
