import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from 'src/styles'

interface Props {
  bars: number
  /**
   * Progress between 0 and 100
   * @type {number}
   */
  progress: number
}

const ProgressCutBar = React.memo(function ProgressCutBarFn({ bars, progress }: Props) {
  const blocks = Array.from(new Array(bars)).map((_, i) => {
    const initial = (100 / bars) * i
    const final = (100 / bars) * (i + 1)
    if (progress > initial && progress < final) {
      return (progress - initial) * bars
    }
    return progress > initial ? 100 : 0
  })

  return (
    <View style={[styles.barContainer]}>
      {blocks.map((width, i) => (
        <View key={i} style={[styles.bar]}>
          <View style={[styles.barProgress, { width: `${width}%` }]} />
        </View>
      ))}
    </View>
  )
})
export default ProgressCutBar

const styles = StyleSheet.create({
  barContainer: {
    height: 16,
    display: 'flex',
    flexDirection: 'row',
  },
  bar: {
    height: 16,
    width: 8,
    marginRight: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  barProgress: {
    height: 16,
    backgroundColor: colors.gold,
  },
})
