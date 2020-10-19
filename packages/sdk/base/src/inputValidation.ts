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
