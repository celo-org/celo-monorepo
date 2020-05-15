import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import { colors, fonts, textStyles } from 'src/styles'

const words = ['finance', 'saving', 'education', 'sending', 'giving', 'lending', 'regeneration']

const DURATION = 8510
const SLIDE_IN_DURATION = 3500
const PAUSE = 3000

const timings = {
  finance: {
    length: 6000,
    pause: 2000,
  },
  saving: {
    length: 6000,
    pause: 2000,
  },
  education: {
    length: 6000,
    pause: 2000,
  },
  sending: {
    length: 6000,
    pause: 2000,
  },
  giving: {
    length: 6000,
    pause: 2000,
  },
  lending: {
    length: 6000,
    pause: 2000,
  },
  regeneration: {
    length: 6000,
    pause: 2000,
  },
}

const animations = {}

Object.keys(timings).forEach((key) => {
  const slideIn = SLIDE_IN_DURATION / DURATION
  const fadeOut = (PAUSE + SLIDE_IN_DURATION) / DURATION
  const fadeOutStop = 1
  animations[key] = {
    duration: `${DURATION}ms`,
    in: [
      {
        '0%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        '2%': {
          transform: [
            {
              translateX: 0,
            },
          ],
        },
        [`${slideIn * 100}%`]: {
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
          opacity: 0,
          // transform: [
          //   {
          //     translateX: '-100%',
          //   },
          // ],
        },
        [`${fadeOut * 100}%`]: {
          opacity: 0,
          // transform: [
          //   {
          //     translateX: '-100%',
          //   },
          // ],
        },
        [`${fadeOutStop * 100}%`]: {
          opacity: 1,
          // transform: [
          //   {
          //     translateX: 0,
          //   },
          // ],
        },
        '100%': {
          opacity: 1,
          // transform: [
          //   {
          //     translateX: 0,
          //   },
          // ],
        },
      },
    ],
  }
})

interface Props {
  playing: boolean
}

interface State {
  currentWord: number
  initial: boolean
}

class TextAnimation extends React.PureComponent<Props, State> {
  state = {
    currentWord: 0,
    initial: true,
  }

  timeout: number

  componentDidMount = () => {
    this.startAnimation()
  }

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
    this.timeout = setTimeout(() => {
      if (this.state.currentWord !== words.length - 1) {
        this.setState({ currentWord: (this.state.currentWord + 1) % words.length, initial: false })
        this.changeWord()
      } else {
        this.setState({ currentWord: 0 })
        this.changeWord()
      }
    }, DURATION)
  }

  render() {
    const word = words[this.state.currentWord]

    const fadeOut: ViewStyle = this.props.playing
      ? {
          animationDuration: animations[word].duration,
          animationKeyframes: animations[word].out,
        }
      : {}

    const slideIn: ViewStyle = this.props.playing
      ? {
          animationDuration: animations[word].duration,
          animationKeyframes: animations[word].in,
        }
      : {}

    return (
      <View>
        <H2 ariaLevel={'2'} accessibilityRole={'heading'} style={[fonts.h2, styles.letsMake]}>
          A new story in
        </H2>
        <View style={styles.textContainer}>
          <View style={[styles.mask, fadeOut]} key={`${this.state.currentWord}-mask1`} />
          <View style={[styles.mask2, slideIn]} key={`${this.state.currentWord}-mask2`} />
          <H2 ariaLevel={'2'} accessibilityRole={'heading'} style={[fonts.h2, textStyles.medium]}>
            {words[this.state.currentWord]}
          </H2>
        </View>
      </View>
    )
  }
}

export default TextAnimation

const styles = StyleSheet.create({
  textContainer: {
    display: 'inline-flex',
    width: 'fit-content',
  },
  letsMake: {
    zIndex: 1,
  },
  mask: {
    height: 45,
    bottom: 0,
    left: 0,
    right: -30,
    top: 8,
    position: 'absolute',
    animationFillMode: 'both',
    animationIterationCount: 1,
    backgroundColor: colors.white,
  },
  mask2: {
    height: 45,
    bottom: 0,
    left: -20,
    right: 0,
    top: 8,
    position: 'absolute',
    backgroundColor: colors.white,
    animationIterationCount: 1,
  },
})
