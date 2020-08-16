// VIEW that contains a TextInput and shows the children right-indented to be used as buttons.

import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native'

type Props = Omit<RNTextInputProps, 'style'> & {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  inputStyle?: RNTextInputProps['style']
  onChangeText: (value: string) => void
}

function TextInputWithButtons({
  style,
  children,
  inputStyle,
  value = '',
  ...passThroughProps
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <TextInput style={[styles.input, inputStyle]} value={value} {...passThroughProps} />
      {children}
    </View>
  )
}

export default TextInputWithButtons
export type TextInputProps = Props

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    ...fontStyles.regular,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 0,
    lineHeight: Platform.select({ android: 22, ios: 20 }), // vertical align = center
  },
})
