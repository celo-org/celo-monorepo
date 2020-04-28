import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useScreenSize } from 'src/layout/ScreenSize'
import globe from 'src/shared/world-spin.gif'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const CHANGE_STORY = [
  'Change the Story', // en
  'Cambia la historia', // es
  '改变故事', // cn
  'Muda a história', // pt
  '새로운 이야기를 쓰다', // ko
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

  const { isMobile } = useScreenSize()

  return (
    <View style={[styles.container, isMobile ? standardStyles.centered : standardStyles.row]}>
      <Image
        source={globe}
        style={[styles.globe, styles.symbols, isMobile && styles.globeMobile]}
      />
      {!isMobile && <Text style={[styles.separator, styles.symbols]}>|</Text>}
      <Wipe text={CHANGE_STORY[count]} />
    </View>
  )
}

interface WipeProps {
  text: string
}

const Wipe = React.memo(function _Wipe({ text }: WipeProps) {
  const { isMobile } = useScreenSize()
  return (
    <View>
      <View key={`hide-${text}`} style={[styles.mask, styles.hide]} />
      <Text
        key={text}
        style={[fonts.legal, isMobile && textStyles.center, textStyles.italic, styles.textFadeIn]}
      >
        "{text}"
      </Text>
      <View key={`reveal-${text}`} style={[styles.mask, styles.reveal]} />
    </View>
  )
})

const DURATION = 4000
const TRANSITION_TIME = 250

const styles = StyleSheet.create({
  globe: {
    width: 20,
    height: 20,
  },
  globeMobile: { marginBottom: 8 },
  symbols: {
    zIndex: 10,
  },
  separator: {
    marginHorizontal: 10,
  },
  textFadeIn: {
    animationFillMode: 'both',
    animationIterationCount: 1,
    animationDuration: '750ms',
    animationKeyframes: [
      {
        from: {
          opacity: 0,
        },
        to: { opacity: 1 },
      },
    ],
  },
  mask: {
    backgroundColor: colors.white,
    position: 'absolute',
    height: '100%',
    width: '101%',
    animationDuration: `${TRANSITION_TIME}ms`,
    animationIterationCount: 1,
    animationTimingFunction: 'linear',
    animationFillMode: 'both',
  },

  hide: {
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
  reveal: {
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
