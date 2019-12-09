import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, standardStyles } from 'src/styles'

interface RacerProps {
  relativePoints: number
  identity: string
  color: colors
}

const COIN_OFFSET = 3

export default React.memo(function Racer({
  color,
  identity,
  relativePoints: relativePoints,
}: RacerProps) {
  const lineAnimationKeyframes = [
    {
      from: {
        transform: [{ translateX: -relativePoints }],
      },
      to: {
        transform: [{ translateX: 0 }],
      },
    },
  ]

  const animationTimingFunction = `cubic-bezier(${Math.random()},${Math.random()},${Math.random()},${Math.random()})`

  return (
    <View style={[standardStyles.elementalMarginTop, styles.containment]}>
      <Text style={[fonts.legal, { color }]}>{identity}</Text>
      <View
        style={[
          standardStyles.row,
          styles.lineGroup,
          styles.animatable,
          { animationKeyframes: lineAnimationKeyframes, animationTimingFunction },
        ]}
      >
        <View style={[styles.line, { width: relativePoints, backgroundColor: color }]} />
        <View style={styles.onLine}>
          <OvalCoin color={color} size={20} />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  containment: { overflow: 'hidden' },
  line: {
    height: 2,
    minWidth: COIN_OFFSET,
  },
  onLine: {
    transform: [{ translateX: -COIN_OFFSET }],
  },
  lineGroup: {
    marginTop: 5,
    alignItems: 'center',
    transformOrigin: 'left',
  },
  animatable: {
    animationDuration: '2s',
    animationDelay: '100ms',
    animationIterationCount: 1,
    animationFillMode: 'both',
  },
})
