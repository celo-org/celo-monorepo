import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'

interface Props {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export default function FormLabel({ style, children }: Props) {
  return <Text style={[styles.container, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  container: {
    ...fontStyles.label,
    color: colors.onboardingBrownLight,
  },
})
