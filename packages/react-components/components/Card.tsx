import colors from '@celo/react-components/styles/colors.v2'
import { elevationShadowStyle } from '@celo/react-components/styles/styles'
import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'

export interface Props extends ViewProps {
  rounded?: boolean
  children?: React.ReactNode
}

export default function Card({ style, rounded = false, ...props }: Props) {
  return <View style={[styles.container, rounded && styles.rounded, style]} {...props} />
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
    ...elevationShadowStyle(12),
    padding: 16,
  },
  rounded: {
    borderRadius: 8,
  },
})
