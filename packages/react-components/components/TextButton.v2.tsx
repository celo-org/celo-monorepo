/**
 * A button that's just text. For ann underlined text link, see Link.tsx
 */

import BorderlessButton from '@celo/react-components/components/BorderlessButton.v2'
import { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: StyleProp<TextStyle>
  testID?: string
}

export default function TextButton({ onPress, style, children, disabled, testID }: Props) {
  return (
    <BorderlessButton
      style={style ? { ...styles.text, ...style } : styles.text}
      onPress={onPress}
      borderless={true}
      disabled={disabled}
      testID={testID}
    >
      {children}
    </BorderlessButton>
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular600,
    color: colors.greenUI,
  },
})
