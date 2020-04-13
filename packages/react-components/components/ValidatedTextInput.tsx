/**
 * TextInput with input validation, interchangeable with `./TextInput.tsx`
 */

import TextInput from '@celo/react-components/components/TextInput'
import { validateInput, ValidatorKind } from '@celo/utils/src/inputValidation'
import * as React from 'react'
import { KeyboardType, TextInputProps } from 'react-native'

interface OwnProps {
  value: string
  onChangeText: (input: string) => void
  keyboardType: KeyboardType
  numberOfDecimals?: number
  placeholder?: string
  decimalSeparator?: string
}

export interface PhoneValidatorProps {
  validator: ValidatorKind.Phone
  countryCallingCode: string
}

export interface IntegerValidatorProps {
  validator: ValidatorKind.Integer
}

export interface DecimalValidatorProps {
  validator: ValidatorKind.Decimal
  numberOfDecimals: number
}

// Required props for a custom input validator
export interface CustomValidatorProps {
  validator: ValidatorKind.Custom
  customValidator: (input: string) => string
}

export type ValidatorProps =
  | PhoneValidatorProps
  | IntegerValidatorProps
  | DecimalValidatorProps
  | CustomValidatorProps

export type ValidatedTextInputProps<V extends ValidatorProps> = OwnProps & V & TextInputProps

export default class ValidatedTextInput<V extends ValidatorProps> extends React.Component<
  ValidatedTextInputProps<V>
> {
  onChangeText = (input: string): void => {
    const validated = validateInput(input, this.props)
    // Don't propagate change if new change is invalid
    if (this.props.value === validated) {
      return
    }

    if (this.props.onChangeText) {
      this.props.onChangeText(validated)
    }
  }

  getMaxLength = () => {
    const { numberOfDecimals, validator, value, decimalSeparator } = this.props

    if (validator !== ValidatorKind.Decimal || !numberOfDecimals) {
      return undefined
    }

    const decimalPos = value.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return undefined
    }

    return decimalPos + (numberOfDecimals as number) + 1
  }

  render() {
    return (
      <TextInput
        maxLength={this.getMaxLength()}
        {...this.props}
        value={this.props.value}
        onChangeText={this.onChangeText}
      />
    )
  }
}
