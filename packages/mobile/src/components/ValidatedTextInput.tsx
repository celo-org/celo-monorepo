import colors from '@celo/react-components/styles/colors'
import { parseInputAmount } from '@celo/utils/src/parsing'
import * as React from 'react'
import { StyleSheet, TextInput, TextInputProps, TextStyle } from 'react-native'

interface OwnProps {
  title?: string
  value: string
  labelStyle?: TextStyle
  numberOfDecimals?: number
  validator?: 'decimal' | 'integer' | 'phone'
  customValidator?: (input: string) => string
}

interface RefProps {
  innerRef?: React.RefObject<TextInput>
}

type Props = RefProps & OwnProps & TextInputProps

interface State {
  active: boolean
  input: string
}

export class ValidatedTextInput extends React.Component<Props, State> {
  state = {
    active: false,
    input: '',
  }

  onFocus = () => {
    this.setState({ active: true })
  }

  onBlur = () => {
    this.setState({ active: false })

    let value = this.props.value
    if (this.props.keyboardType === 'numeric' && this.props.numberOfDecimals) {
      value = parseInputAmount(value)
        .toFixed(this.props.numberOfDecimals)
        .toString()
    }

    if (this.props.onChangeText) {
      this.props.onChangeText(value)
    }
  }

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
    return input.replace(/[^0-9()-]/, '')
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

    return input
  }

  onChangeText = (input: string) => {
    const validated = this.validateInput(input)
    this.setState({ input: validated })
    if (this.props.onChangeText) {
      this.props.onChangeText(validated)
    }
  }

  getMaxLength = () => {
    const DEFAULT_LENGTH = 999
    if (!this.props.numberOfDecimals) {
      return DEFAULT_LENGTH
    }

    const decimalPos = this.state.input.indexOf('.')
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
        value={this.state.input}
        onChangeText={this.onChangeText}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
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
