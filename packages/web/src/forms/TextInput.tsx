import * as React from 'react'
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
} from 'react-native'

interface TextInputState {
  focused: boolean
}

interface TextInputAuxProps {
  focusStyle: TextStyle
}

type FocusEvent = NativeSyntheticEvent<TextInputFocusEventData>

export class TextInput extends React.PureComponent<
  TextInputProps & TextInputAuxProps,
  TextInputState
> {
  state = { focused: false }

  onFocus = (e: FocusEvent) => {
    this.setState({ focused: true })
    if (this.props.onFocus) {
      this.props.onFocus(e)
    }
  }

  onBlur = (e: FocusEvent) => {
    this.setState({ focused: false })
    if (this.props.onBlur) {
      this.props.onBlur(e)
    }
  }

  render() {
    const { style, focusStyle, ...props } = this.props
    const currentStyle = this.state.focused ? StyleSheet.flatten([style, focusStyle]) : style
    return (
      <RNTextInput {...props} onFocus={this.onFocus} onBlur={this.onBlur} style={currentStyle} />
    )
  }
}

export default TextInput
