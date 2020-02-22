import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import globe from 'src/shared/world-spin.gif'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const CHANGE_STORY = [
  'Change the Story', // en
  'Cambia la historia', // es
  'Muda a história', // pt
  '改变故事', // cn
  // '', // ko
]

export default function ChangeStory() {
  const [count, setCount] = React.useState(0)

  const next = () => {
    setCount((current) => {
      return current + 1 < CHANGE_STORY.length ? current + 1 : 0
    })
  }

  React.useEffect(() => {
    const timer = setTimeout(next, DURATION)
    return () => clearTimeout(timer)
  }, [count])

  return (
    <View style={[standardStyles.row, styles.container]}>
      <Image source={globe} style={[styles.globe, styles.symbols]} />
      <Text style={[styles.separator, styles.symbols]}>|</Text>
      <Wipe count={count} text={CHANGE_STORY[count]} />
    </View>
  )
}

function Wipe({ text, count }) {
  return (
    <View>
      <View
        key={count}
        // @ts-ignore
        style={[styles.mask, count % 2 === 0 ? styles.left : styles.right]}
      />
      <Text style={[fonts.legal, textStyles.italic]}>"{text}"</Text>
    </View>
  )
}

const DURATION = 5000
const TRANSITION_TIME = 1000

const styles = StyleSheet.create({
  globe: {
    width: 20,
    height: 20,
  },
  symbols: {
    zIndex: 10,
  },
  separator: {
    marginHorizontal: 10,
  },

  mask: {
    backgroundColor: colors.purpleScreen,
    position: 'absolute',
    height: '100%',
    width: '101%',
    animationDuration: `${TRANSITION_TIME}ms`,
    animationFillMode: 'both',
    animationIterationCount: 1,
    animationTimingFunction: 'linear',
  },

  left: {
    animationDelay: `${DURATION - TRANSITION_TIME * 2}ms`,
    animationKeyframes: [
      {
        '0%': {
          transform: [{ translateX: '-100%' }],
        },
        '100%': { transform: [{ translateX: 0 }] },
      },
    ],
  },
  right: {
    animationKeyframes: [
      {
        '0%': {
          transform: [{ translateX: 0 }],
        },
        '100%': { transform: [{ translateX: '100%' }] },
      },
    ],
  },
  container: {
    marginBottom: 20,
  },
})
