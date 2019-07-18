import hexRgba from 'hex-rgba'
import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import Responsive from 'src/shared/Responsive'
import { colors, textStyles } from 'src/styles'

const words = ['universal', 'move', 'sustainable', 'connected', 'accessible']

const textTransitionTime = 800

const timings = {
  universal: {
    length: 4400,
    pause: 600,
  },
  move: {
    length: 4250,
    pause: 200,
  },
  sustainable: {
    length: 4600,
    pause: 200,
  },
  connected: {
    length: 3200,
    pause: 600,
  },
  accessible: {
    length: 6350,
    pause: 200,
  },
}

const animations = {}

Object.keys(timings).forEach((key) => {
  const duration = timings[key].length + timings[key].pause
  const fadeIn = textTransitionTime / duration
  const fadeOut = (timings[key].length - textTransitionTime) / duration
  const fadeOutStop = timings[key].length / duration

  animations[key] = {
    duration: `${duration}ms`,
    in: [
      {
        '0%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        [`${fadeIn * 100}%`]: {
          transform: [
            {
              translateX: '100%',
            },
          ],
        },
        '100%': {
          transform: [
            {
              translateX: '100%',
            },
          ],
        },
      },
    ],
    out: [
      {
        '0%': {
          transform: [
            {
              translateX: '-100%',
            },
          ],
        },
        [`${fadeOut * 100}%`]: {
          transform: [
            {
              translateX: '-100%',
            },
          ],
        },
        [`${fadeOutStop * 100}%`]: {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        '100%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
      },
    ],
  }
})

interface Props {
  playing: boolean
}

class TextAnimation extends React.PureComponent<Props> {
  state = {
    currentWord: 0,
  }

  timeout: number

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.playing && this.props.playing) {
      this.startAnimation()
    }
  }

  startAnimation = () => {
    clearTimeout(this.timeout)
    this.setState({ currentWord: 0 }, this.changeWord)
  }

  changeWord = () => {
    const word = words[this.state.currentWord]
    const duration = timings[word].length + timings[word].pause
    this.timeout = setTimeout(() => {
      if (this.state.currentWord !== 4) {
        this.setState({ currentWord: (this.state.currentWord + 1) % 5 })
        this.changeWord()
      }
    }, duration)
  }

  render() {
    const word = words[this.state.currentWord]
    const fadeOut: ViewStyle = this.props.playing
      ? {
          // @ts-ignore
          animationDuration: animations[word].duration,
          animationKeyframes: animations[word].out,
        }
      : {}

    const fadeIn: ViewStyle = this.props.playing
      ? {
          // @ts-ignore
          animationDuration: animations[word].duration,
          animationKeyframes: animations[word].in,
        }
      : {}

    return (
      <Responsive large={[styles.textContainer, styles.textContainerLarge]}>
        <View style={styles.textContainer}>
          <H1 accessibilityRole={'heading'} style={[styles.white, styles.letsMake]}>
            Let's make money{' '}
          </H1>
          <View>
            <View style={[styles.mask, fadeOut]} key={`${this.state.currentWord}-mask1`} />
            <View style={[styles.mask2, fadeIn]} key={`${this.state.currentWord}-mask2`} />
            <H1
              accessibilityRole={'heading'}
              style={[styles.white, textStyles.heavy, textStyles.center]}
            >
              {words[this.state.currentWord]}
            </H1>
          </View>
        </View>
      </Responsive>
    )
  }
}

export default TextAnimation

const gradientOpaque = hexRgba(colors.dark, 100)
const gradientTransparent = hexRgba(colors.dark, 0)

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  textContainerLarge: {
    flexDirection: 'row',
    marginLeft: 25,
  },
  white: {
    color: colors.white,
  },
  word: {
    width: 220,
  },
  letsMake: {
    textAlign: 'center',
    zIndex: 1,
  },
  mask: {
    bottom: 0,
    left: 0,
    right: -30,
    top: 0,
    backgroundImage: `linear-gradient(90deg, ${gradientOpaque} 0%, ${gradientOpaque} 90%, ${gradientTransparent} 100%)`,
    position: 'absolute',
    animationIterationCount: 1,
  },
  mask2: {
    bottom: 0,
    left: -20,
    right: 0,
    top: 0,
    backgroundImage: `linear-gradient(90deg, ${gradientTransparent} 0%, ${gradientOpaque} 10%, ${gradientOpaque} 100%)`,
    position: 'absolute',
    animationIterationCount: 1,
  },
})
