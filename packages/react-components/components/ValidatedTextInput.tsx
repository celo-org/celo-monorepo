import { validateInput } from '@celo/utils/src/inputValidation'
import * as React from 'react'
import { TextInput, TextInputProps } from 'react-native'

interface OwnProps {
  value: string
  numberOfDecimals?: number
  placeholder?: string
  onChangeText: (input: string) => void
}

// Required props when validator type is phone
interface PhoneValidatorProps {
  validator: 'phone'
  countryCallingCode: string
  // Following props unused w/ 'phone' validator but required to be defined
  customValidator?: CustomValidatorProps['customValidator']
}

interface NumberValidatorProps {
  validator?: 'integer' | 'decimal'
  // Following props unused w/ number validators but required to be defined
  countryCallingCode?: string
  customValidator?: CustomValidatorProps['customValidator']
}

interface CustomValidatorProps {
  validator: 'custom'
  customValidator: (input: string) => string
  // Following props unused w/ 'custom' but required to be defined
  countryCallingCode?: string
}

export type ValidatorProps = PhoneValidatorProps | NumberValidatorProps | CustomValidatorProps

interface RefProps {
  innerRef?: React.RefObject<TextInput>
}

type Props = OwnProps & ValidatorProps & RefProps & TextInputProps

class ValidatedTextInput extends React.Component<Props> {
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
