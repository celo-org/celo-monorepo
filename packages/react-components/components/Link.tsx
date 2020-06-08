/**
 * An underlined text link. For a button that's just text, see TextButton.tsx
 */

import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native'

type Props = Omit<TouchableProps, 'style'> & {
  style?: StyleProp<TextStyle>
}

export default function Link(props: Props) {
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
    fontSize: 13,
    textDecorationLine: 'underline',
  },
})
