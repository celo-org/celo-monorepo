/**
 * A button that's just text. For ann underlined text link, see Link.tsx
 */

import BorderlessButton, { Props } from '@celo/react-components/components/BorderlessButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { StyleSheet } from 'react-native'

export default function TextButton({ style, ...passThroughProps }: Props) {
  return (
    <BorderlessButton {...passThroughProps} style={style ? [styles.text, style] : styles.text} />
  )
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular600,
    color: colors.greenUI,
  },
})
