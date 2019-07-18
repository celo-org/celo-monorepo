import CircleButton from '@celo/react-components/components/CircleButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, TextInput as RNTextInput, TextInputProperties, View } from 'react-native'

interface Props {
  onChangeText: (pin1: string) => void
  onEndEditing?: () => void
  onSubmitEditing?: () => void
  onFocus?: () => void
  value?: string
  style?: object
  isSensitiveInput?: boolean
  keyboardType?: TextInputProperties['keyboardType']
  textContentType?: any
  placeholder?: string
  autoFocus?: boolean
  autoCorrect?: boolean
  testID?: string
  placeholderTextColor?: string
  enablesReturnKeyAutomatically?: boolean
  showClearButton?: boolean
  underlineColorAndroid?: string
  forwardedRef?: React.RefObject<RNTextInput>
}

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

  handleInputFocus = () => {
    const { onFocus } = this.props
    this.setState({ isFocused: true })
    if (onFocus) {
      onFocus()
    }
  }

  handleInputBlur = () => {
    this.setState({ isFocused: false })
  }

  onClear = () => {
    this.props.onChangeText('')
  }

  render() {
    const {
      style: propsStyle,
      onChangeText,
      onSubmitEditing,
      onEndEditing,
      placeholderTextColor,
      enablesReturnKeyAutomatically,
      testID,
      value = '',
      isSensitiveInput = false,
      autoCorrect = true,
      keyboardType = 'default',
      textContentType = 'none',
      underlineColorAndroid = 'transparent',
      placeholder = '',
      autoFocus = false,
      showClearButton = true,
      forwardedRef,
    } = this.props

    const { isFocused = false } = this.state

    return (
      <View style={[style.container, propsStyle]}>
        <RNTextInput
          ref={forwardedRef}
          style={[fontStyles.regular, style.borderedText, style.numberInput]}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          onFocus={this.handleInputFocus}
          onBlur={this.handleInputBlur}
          value={value}
          underlineColorAndroid={underlineColorAndroid}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={isSensitiveInput}
          // @ts-ignore until we upgrade '@types/react-native'
          textContentType={textContentType}
          autoCorrect={autoCorrect}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          placeholderTextColor={placeholderTextColor}
          enablesReturnKeyAutomatically={enablesReturnKeyAutomatically}
          testID={testID}
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
