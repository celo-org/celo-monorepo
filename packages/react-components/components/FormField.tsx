import FormLabel from '@celo/react-components/components/FormLabel'
import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  style?: StyleProp<ViewStyle>
  label: string
  children?: React.ReactNode
}

// A form field with a label and children
export default function FormField({ style, label, children }: Props) {
  return (
    <View style={[styles.container, style]}>
      <FormLabel>{label}</FormLabel>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
})
