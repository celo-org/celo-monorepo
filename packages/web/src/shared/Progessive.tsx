import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from 'src/styles'

export default function Progressive() {
  return (
    <View style={styles.container}>
      <View style={styles.bar} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    height: 2,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    righ: 0,
  },
  bar: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
    animationFillMode: 'both',
    backgroundColor: colors.primary,
    animationTimingFunction: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    animationDuration: `7s`,
    animationKeyframes: [
      {
        '0%': {
          transform: [{ scaleX: 0 }],
        },

        to: {
          transform: [{ scaleX: 1 }],
        },
      },
    ],
  },
})
