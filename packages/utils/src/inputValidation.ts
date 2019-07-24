import { getDisplayPhoneNumber } from './phoneNumbers'

interface BaseProps {
  validator?: 'phone' | 'integer' | 'decimal' | 'custom'
  customValidator?: (input: string) => string
  countryCallingCode?: string
}

export function validateInteger(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

export function validateDecimal(input: string): string {
  // Keep only first decimal
  return input
    .replace(/[^0-9.]/g, '')
    .replace(/\./, 'b')
    .replace(/\./g, '')
    .replace(/b/, '.')
}

export function validatePhone(input: string, countryCallingCode: string): string {
  input = input.replace(/[^0-9()- ]/g, '')
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
      return validateDecimal(input)
    case 'integer':
      return validateInteger(input)
    case 'phone':
      // countryCallingCode should be defined but it can be an empty string: no falsy null check
      if (props.countryCallingCode === undefined) {
        throw new Error('countryCallingCode is not defined')
      }
      return validatePhone(input, props.countryCallingCode)
    case 'custom': {
      if (props.customValidator) {
        return props.customValidator(input)
      }
    }
  }

  throw new Error('Unhandled input validator')
}
