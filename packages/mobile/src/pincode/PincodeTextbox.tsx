import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  pin: string
  placeholder: string
}

export default function PincodeTextbox({ pin, placeholder }: Props) {
  const text = pin ? '\u25CF'.repeat(pin.length) : placeholder
  const fontStyle = pin ? style.dotsText : style.placeHolderText

  return (
    <View style={[componentStyles.roundedBorder, style.container]}>
      <Text style={fontStyle}>{text}</Text>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    width: 180,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dotsText: {
    ...fontStyles.bodySmall,
    letterSpacing: 2,
  },
  placeHolderText: {
    ...fontStyles.bodySecondary,
    color: colors.inactive,
  },
})
