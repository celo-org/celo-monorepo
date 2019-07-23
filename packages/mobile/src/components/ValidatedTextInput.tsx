import colors from '@celo/react-components/styles/colors'
import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { StyleSheet, TextInput, TextInputProps } from 'react-native'

interface OwnProps {
  // Require both value and onChangeText to propagate changes
  value: string
  onChangeText: TextInputProps['onChangeText']
  numberOfDecimals?: number
  customValidator?: (input: string) => string
  onInputChange?: () => void
}

// only require countryCallingCode when validator type is phone
interface PhoneValidatorProps {
  validator: 'phone'
  countryCallingCode: string
}

interface NumberValidatorProps {
  validator?: 'integer' | 'decimal'
  countryCallingCode?: string
}

type ValidatorProps = PhoneValidatorProps | NumberValidatorProps

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
      .replace(/\./, 'a')
      .replace(/\./g, '')
      .replace(/a/, '.')
  }

  validatePhone = (input: string): string => {
    input = input.replace(/[^0-9()-]/, '')
    const phoneDetails = parsePhoneNumber(input, this.props.countryCallingCode)
    return phoneDetails.displayNumber
  }

  validateInput = (input: string): string => {
    if (!this.props.validator && !this.props.customValidator) {
      return input
    }

    if (this.props.customValidator) {
      return this.props.customValidator(input)
    }

    if (this.props.validator === 'decimal') {
      return this.validateDecimal(input)
    }

    if (this.props.validator === 'integer') {
      return this.validateInteger(input)
    }

    if (this.props.validator === 'phone') {
      return this.validatePhone(input)
    }

    throw new Error('Unhandled input validator')
  }

  onChangeText = (input: string) => {
    const validated = this.validateInput(input)
    // pass the validated text to parent
    this.props.onChangeText(validated)
  }

  getMaxLength = () => {
    const DEFAULT_LENGTH = 999
    if (!this.props.numberOfDecimals) {
      return DEFAULT_LENGTH
    }

    const decimalPos = this.props.value.indexOf('.')
    if (decimalPos === -1) {
      return DEFAULT_LENGTH
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

const style = StyleSheet.create({
  titleContainer: {
    minWidth: 45,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  title: {
    color: colors.darkSecondary,
    alignSelf: 'center',
    lineHeight: 30,
  },
  divider: {
    width: 1,
    height: 35,
  },
  textInput: {
    flex: 1,
    height: 54,
    marginHorizontal: 8,
  },
})

export default React.forwardRef((props: Props, ref?: React.Ref<TextInput>) => (
  <ValidatedTextInput innerRef={ref as React.RefObject<TextInput>} {...props} />
))
