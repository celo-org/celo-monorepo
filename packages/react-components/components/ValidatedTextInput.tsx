import { ParsedPhoneNumber, parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { TextInput, TextInputProps } from 'react-native'

interface OwnProps {
  value: string
  numberOfDecimals?: number
}

// Required props when validator type is phone
interface PhoneValidatorProps {
  validator: 'phone'
  countryCallingCode: string
  onChangePhoneNumber: (input: string, phoneDetails: ParsedPhoneNumber) => void
  // Following props unused but required to be defined
  onChangeText?: NumberValidatorProps['onChangeText']
  customValidator?: CustomValidatorProps['customValidator']
}

interface NumberValidatorProps {
  validator?: 'integer' | 'decimal'
  onChangeText: (input: string) => void
  // Following props unused but required to be defined
  countryCallingCode?: string
  onChangePhoneNumber?: PhoneValidatorProps['onChangePhoneNumber']
  customValidator?: CustomValidatorProps['customValidator']
}

interface CustomValidatorProps {
  validator: 'custom'
  customValidator: (input: string) => string
  onChangeText: NumberValidatorProps['onChangeText']
  // Following props unused but required to be defined
  countryCallingCode?: string
  onChangePhoneNumber?: PhoneValidatorProps['onChangePhoneNumber']
}

type ValidatorProps = PhoneValidatorProps | NumberValidatorProps | CustomValidatorProps

interface RefProps {
  innerRef?: React.RefObject<TextInput>
}

type Props = OwnProps & ValidatorProps & RefProps & TextInputProps

class ValidatedTextInput extends React.Component<Props> {
  validateInteger = (input: string): string => {
    return input.replace(/[^0-9]/, '')
  }

  validateDecimal = (input: string): string => {
    return input
      .replace(/[^0-9.]/, '')
      .replace(/\./, 'b') // Keep only the first decimal
      .replace(/\./g, '')
      .replace(/b/, '.')
  }

  validatePhone = (input: string): string => {
    input = input.replace(/[^0-9()-]/, '')
    // countryCallingCode must be defined as this is reachable only via phone validator
    const phoneDetails = parsePhoneNumber(input, this.props.countryCallingCode!)

    if (!phoneDetails) {
      return input
    }

    if (this.props.onChangePhoneNumber) {
      this.props.onChangePhoneNumber(input, phoneDetails)
    }

    return phoneDetails.displayNumber
  }

  validateInput = (input: string): string => {
    if (!this.props.validator && !this.props.customValidator) {
      return input
    }

    switch (this.props.validator) {
      case 'decimal':
        return this.validateDecimal(input)
      case 'integer':
        return this.validateInteger(input)
      case 'phone':
        return this.validatePhone(input)
      case 'custom':
        return this.props.customValidator(input)
    }

    throw new Error('Unhandled input validator')
  }

  onChangeText = (input: string): void => {
    const validated = this.validateInput(input)
    // pass the validated text to parent
    if (input === validated) {
      return
    }

    if (this.props.onChangeText) {
      this.props.onChangeText(validated)
    }
  }

  getMaxLength = () => {
    if (!this.props.numberOfDecimals) {
      return undefined
    }

    const decimalPos = this.props.value.indexOf('.')
    if (decimalPos === -1) {
      return undefined
    }

    if (decimalPos) {
      return decimalPos + this.props.numberOfDecimals + 1
    }
  }

  render() {
    return (
      <TextInput
        maxLength={this.getMaxLength()}
        {...this.props}
        ref={this.props.innerRef}
        value={this.props.value}
        onChangeText={this.onChangeText}
      />
    )
  }
}

export default React.forwardRef((props: Props, ref?: React.Ref<TextInput>) => (
  <ValidatedTextInput innerRef={ref as React.RefObject<TextInput>} {...props} />
))
