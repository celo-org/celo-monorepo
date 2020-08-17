import { BaseProps, validateDecimal, validateInteger } from '@celo/base/lib/inputValidation'
import { getDisplayPhoneNumber } from './phoneNumbers'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export {
  BaseProps,
  validateDecimal,
  validateInteger,
  ValidatorKind,
} from '@celo/base/lib/inputValidation'

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
