/**
 * A button that's just text. For ann underlined text link, see Link.tsx
 */

import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native'

type Props = Omit<TouchableProps, 'style'> & {
  style?: StyleProp<TextStyle>
}

export default function TextButton(props: Props) {
  const { style: customStyle, children, ...passThroughProps } = props
  return (
    <Touchable {...passThroughProps} borderless={true}>
      <Text style={[styles.text, customStyle]}>{children}</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.bodySmall,
    ...fontStyles.semiBold,
    color: colors.greenBrand,
  },
})
