/**
 * An underlined text link. For a button that's just text, see TextButton.tsx
 */

import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: TextStyle | TextStyle[]
  testID?: string
}

export default function Link(props: Props) {
  const { onPress, style: customStyle, children, disabled, testID } = props
  return (
    <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
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
