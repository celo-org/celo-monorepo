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
  decimalSeparator?: string
}

export function validateInteger(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

export function validateDecimal(input: string, decimalSeparator: string = '.'): string {
  const regex = decimalSeparator === ',' ? /[^0-9,]/g : /[^0-9.]/g

  const cleanedArray = input.replace(regex, '').split(decimalSeparator)

  if (cleanedArray.length <= 1) {
    // Empty string or no decimals
    return cleanedArray.join('')
  } else {
    return cleanedArray.shift() + decimalSeparator + cleanedArray.join('')
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
      return validateDecimal(input, props.decimalSeparator)
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
