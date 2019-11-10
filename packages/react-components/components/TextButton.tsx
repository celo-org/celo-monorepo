/**
 * A button that's just text. For ann underlined text link, see Link.tsx
 */

import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: TextStyle | Array<TextStyle | undefined | false>
  testID?: string
}

export default function TextButton(props: Props) {
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
    ...fontStyles.semiBold,
    color: colors.celoGreen,
  },
})
