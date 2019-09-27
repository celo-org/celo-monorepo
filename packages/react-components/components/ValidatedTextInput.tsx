/**
 * TextInput with input validation, interchangeable with `./TextInput.tsx` and
 * React Native's TextInput if input validation is required.  Set the
 * `nativeInput` prop to `true` for RN TextInput replacement without visual
 * changes.
 */

import TextInput from '@celo/react-components/components/TextInput'
import { validateInput, ValidatorKind } from '@celo/utils/src/inputValidation'
import * as React from 'react'
import { TextInput as RNTextInput, TextInputProps } from 'react-native'

interface OwnProps {
  value: string
  numberOfDecimals?: number
  placeholder?: string
  lng?: string
  nativeInput?: boolean
  onChangeText: (input: string) => void
}

// Required props when validator type is phone
interface PhoneValidatorProps {
  validator: ValidatorKind.Phone
  countryCallingCode: string
  // Following props unused w/ 'phone' validator but required to be defined
  customValidator?: CustomValidatorProps['customValidator']
}

interface NumberValidatorProps {
  validator?: ValidatorKind.Integer | ValidatorKind.Decimal
  // Following props unused w/ number validators but required to be defined
  countryCallingCode?: string
  customValidator?: CustomValidatorProps['customValidator']
}

interface CustomValidatorProps {
  validator: ValidatorKind.Custom
  customValidator: (input: string) => string
  // Following props unused w/ 'custom' but required to be defined
  countryCallingCode?: string
}

export type ValidatorProps = PhoneValidatorProps | NumberValidatorProps | CustomValidatorProps

type Props = OwnProps & ValidatorProps & TextInputProps

export default class ValidatedTextInput extends React.Component<Props> {
  onChangeText = (input: string): void => {
    const validated = validateInput(input, this.props)
    // Don't propagate change if new change is invalid
    if (this.props.value === validated) {
      return
    }

    if (!this.props.onChangeText) {
      return
    }

    this.props.onChangeText(validated)
  }

  getMaxLength = () => {
    if (!this.props.numberOfDecimals) {
      return undefined
    }

    const { value, lng } = this.props

    const decimalPos = lng && lng.startsWith('es') ? value.indexOf(',') : value.indexOf('.')
    if (decimalPos === -1) {
      return undefined
    }

    return decimalPos + this.props.numberOfDecimals + 1
  }

  render() {
    const { nativeInput = false } = this.props
    return nativeInput ? (
      <RNTextInput
        maxLength={this.getMaxLength()}
        {...this.props}
        value={this.props.value}
        onChangeText={this.onChangeText}
      />
    ) : (
      <TextInput
        maxLength={this.getMaxLength()}
        {...this.props}
        value={this.props.value}
        onChangeText={this.onChangeText}
      />
    )
  }
}
