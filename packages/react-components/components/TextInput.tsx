/**
 * TextInput with a button to clear input
 */

import CircleButton from '@celo/react-components/components/CircleButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputFocusEventData,
  TextInputProps,
  View,
} from 'react-native'

interface OwnProps {
  onChangeText: (value: string) => void
  testID?: string
  showClearButton?: boolean
  forwardedRef?: React.RefObject<RNTextInput>
}

type Props = OwnProps & TextInputProps

interface State {
  isFocused: boolean
}

export class CTextInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isFocused: props.autoFocus || false,
    }
  }

  handleInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    this.setState({ isFocused: true })
    if (this.props.onFocus) {
      this.props.onFocus(e)
    }
  }

  handleInputBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    this.setState({ isFocused: false })
    if (this.props.onBlur) {
      this.props.onBlur(e)
    }
  }

  onClear = () => {
    this.props.onChangeText('')
  }

  render() {
    const {
      style: propsStyle,
      value = '',
      showClearButton = true,
      forwardedRef,
      ...passThroughProps
    } = this.props

    const { isFocused = false } = this.state

    return (
      <View style={[style.container, propsStyle]}>
        <RNTextInput
          ref={forwardedRef}
          style={[fontStyles.regular, style.borderedText, style.numberInput]}
          value={value}
          {...passThroughProps}
          onFocus={this.handleInputFocus}
          onBlur={this.handleInputBlur}
        />
        {isFocused &&
          !!value &&
          showClearButton && (
            <CircleButton
              style={style.iconStyle}
              onPress={this.onClear}
              solid={true}
              size={20}
              activeColor={colors.gray}
              inactiveColor={colors.darkLightest}
            />
          )}
      </View>
    )
  }
}

// @ts-ignore TODO(cmcewen): Figure out how to type this properly
const TextInput = React.forwardRef((props: Props, ref: React.RefObject<RNTextInput>) => {
  return <CTextInput {...props} forwardedRef={ref} />
})

export default TextInput
export type TextInputProps = Props

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderedText: {
    borderColor: colors.inputBorder,
    borderRadius: 3,
    padding: 8,
  },
  numberInput: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  iconStyle: {
    marginRight: 8,
  },
})
