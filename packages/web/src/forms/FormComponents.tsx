import * as React from 'react'
import { unstable_createElement as createElement, ViewProps, ViewStyle } from 'react-native-web'

export function Form(props: ViewProps & { children: React.ReactNode }) {
  return createElement('form', props)
}

interface NativeLabelProps {
  children: React.ReactNode
  for: string
  onPress: (x: any) => void
  style?: ViewStyle
}

export function Label({ children, for: htmlFor, onPress, style }: NativeLabelProps) {
  return createElement('label', { for: htmlFor, name: htmlFor, children, onClick: onPress, style })
}
