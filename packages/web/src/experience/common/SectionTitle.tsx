import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import { standardStyles } from 'src/styles'

interface Props {
  children: string
  containerStyle?: ViewStyle
}

export default function SectionTitle({ children, containerStyle }: Props) {
  return (
    <View style={[styles.border, standardStyles.blockMarginTop, containerStyle]}>
      <H2>{children}</H2>
    </View>
  )
}

const styles = StyleSheet.create({
  border: {
    paddingBottom: 10,
    marginVertical: 20,
  },
})
