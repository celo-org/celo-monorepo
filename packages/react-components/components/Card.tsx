import colors from '@celo/react-components/styles/colors'
import { getShadowStyle, Shadow } from '@celo/react-components/styles/styles.v2'
import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'

export interface Props extends ViewProps {
  rounded?: boolean
  shadow?: Shadow | null
  children?: React.ReactNode
}

export default function Card({ style, rounded = false, shadow = Shadow.Soft, ...props }: Props) {
  return (
    <View
      style={[
        styles.container,
        rounded && styles.rounded,
        shadow ? getShadowStyle(shadow) : undefined,
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light,
    padding: 16,
  },
  rounded: {
    borderRadius: 8,
  },
})
