import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import useFade, { Options } from 'src/hooks/useFade'

type Props = Options & {
  children: React.ReactNode
  style?: ViewStyle
}

export default function Fade(props: Props) {
  const { children, ...options } = props

  const { style, ref } = useFade(options)

  return (
    <View ref={ref} style={[style, props.style]}>
      {children}
    </View>
  )
}
