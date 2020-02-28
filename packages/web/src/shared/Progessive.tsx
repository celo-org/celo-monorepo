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
    // backgroundColor: colors.white,
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
    animationFillMode: 'both',
    backgroundColor: colors.primary,
    animationDuration: `10s`,
    animationKeyframes: [
      {
        from: {
          width: '10%',
        },

        to: {
          width: '50%',
        },
      },
    ],
  },
})
