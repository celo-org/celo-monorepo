import { TextButtonGeneric } from '@celo/react-components/components/TextButton.v2'
import { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: StyleProp<TextStyle>
  testID?: string
}

export default function TopBarButton({ onPress, style, children, disabled, testID }: Props) {
  return (
    <TextButtonGeneric
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={style ? { ...styles.text, ...style } : styles.text}
    >
      {children}
    </TextButtonGeneric>
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular500,
    color: colors.greenUI,
    paddingHorizontal: 16,
  },
})
