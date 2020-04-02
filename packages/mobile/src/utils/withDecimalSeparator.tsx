import * as React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'

export interface WithDecimalSeparatorProps {
  decimalSeparator?: string
}

export const withDecimalSeparator = <T extends WithDecimalSeparatorProps>(
  Component: React.ComponentType<T>
) => (props: T) => {
  const { decimalSeparator } = getNumberFormatSettings()
  return <Component {...props} decimalSeparator={decimalSeparator} />
}

export const convertToPeriodDecimalSeparator = (value: string) => {
  const { decimalSeparator } = getNumberFormatSettings()
  if (decimalSeparator !== '.') {
    value = value.replace(decimalSeparator, '.')
  }
  return value
}
