/**
 * A button that's just text. For ann underlined text link, see Link.tsx
 */

import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: StyleProp<TextStyle>
  testID?: string
}
// unstyled Touchable Text, good for making other Text Buttons such as TopBarButton
export function TextButtonGeneric(props: Props) {
  const { onPress, style, children, disabled, testID } = props
  return (
    <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
      <Text style={style}>{children}</Text>
    </Touchable>
  )
}

export default function TextButton({ onPress, style, children, disabled, testID }: Props) {
  return (
    <TextButtonGeneric
      style={style ? { ...styles.text, ...style } : styles.text}
      onPress={onPress}
      borderless={true}
      disabled={disabled}
      testID={testID}
    >
      {children}
    </TextButtonGeneric>
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular600,
    color: colors.greenUI,
  },
})
