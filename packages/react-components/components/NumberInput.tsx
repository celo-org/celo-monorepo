import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, TextInput, TextInputProperties, View, ViewStyle } from 'react-native'

interface Props {
  onChange: (pin1: string) => void
  onSubmit: () => void
  value?: string
  style?: ViewStyle
  isSensitiveInput?: boolean
  keyboardType?: TextInputProperties['keyboardType']
  textContentType?: any
  placeholder?: string
  autoFocus?: boolean
  testID?: string
}

export default class NumberInput extends React.Component<Props> {
  render() {
    const {
      style: propsStyle,
      onChange,
      onSubmit,
      value = '',
      isSensitiveInput = false,
      keyboardType = 'default',
      textContentType = 'none',
      placeholder = '',
      autoFocus = false,
      testID,
    } = this.props

    return (
      <View style={[style.container, propsStyle]}>
        <TextInput
          style={[style.borderedText, style.numberInput]}
          onChangeText={onChange}
          value={value}
          underlineColorAndroid="transparent"
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={isSensitiveInput}
          // @ts-ignore until we upgrade '@types/react-native'
          textContentType={textContentType}
          maxLength={6}
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          testID={testID}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    paddingHorizontal: 60,
    paddingVertical: 15,
  },
  borderedText: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    padding: 7,
    fontSize: 24,
  },
  numberInput: {
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
})
