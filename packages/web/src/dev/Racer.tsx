import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, standardStyles } from 'src/styles'

interface RacerProps {
  relativePoints: number
  identity: string
  color: colors
}

const COIN_OFFSET = 5

export default React.memo(function Racer({
  color,
  identity,
  relativePoints: relativePoints,
}: RacerProps) {
  const lineAnimationKeyframes = [
    {
      from: {
        transform: [{ scaleX: 1 }],
      },
      to: {
        transform: [{ scaleX: relativePoints }],
      },
    },
  ]

  const coinAnimationKeyframes = [
    {
      from: {
        transform: [{ translateX: -COIN_OFFSET }],
      },
      to: {
        transform: [{ translateX: relativePoints - COIN_OFFSET }],
      },
    },
  ]

  const animationTimingFunction = `cubic-bezier(${Math.random()},${Math.random()},${Math.random()},${Math.random()})`

  return (
    <View style={[standardStyles.elementalMarginTop]}>
      <Text style={[fonts.legal, { color }]}>{identity}</Text>
      <View style={[standardStyles.row, styles.lineGroup]}>
        <View
          style={[
            styles.line,
            styles.animatable,
            {
              backgroundColor: color,
              animationKeyframes: lineAnimationKeyframes,
              animationTimingFunction,
            },
          ]}
        />
        <View
          style={[
            styles.onLine,
            styles.animatable,
            { animationKeyframes: coinAnimationKeyframes, animationTimingFunction },
          ]}
        >
          <OvalCoin color={color} size={20} />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  line: {
    height: 2,
    width: 1,

    transformOrigin: 'left',
  },
  onLine: {
    transform: [{ translateX: -COIN_OFFSET }],
  },
  lineGroup: {
    marginTop: 5,
    alignItems: 'center',
  },
  animatable: {
    animationDuration: '2s',
    animationDelay: '100ms',
    animationIterationCount: 1,
    // animationTimingFunction: 'ease-in',
    animationFillMode: 'both',
  },
})
