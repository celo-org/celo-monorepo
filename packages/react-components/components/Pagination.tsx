import progressDots from '@celo/react-components/styles/progressDots'
import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  count: number
  activeIndex: number
  style?: StyleProp<ViewStyle>
  dotStyle?: StyleProp<ViewStyle>
  activeDotStyle?: StyleProp<ViewStyle>
}

export default function Pagination({
  count,
  activeIndex,
  style,
  dotStyle = progressDots.circlePassive,
  activeDotStyle = progressDots.circleActive,
}: Props) {
  if (count < 2) {
    return null
  }

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((n, i) => {
        return <View key={i} style={activeIndex === i ? activeDotStyle : dotStyle} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
