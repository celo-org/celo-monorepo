import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import { colors, fonts, textStyles } from 'src/styles'

const words = ['finance', 'saving', 'education', 'sending', 'giving', 'lending', 'regeneration']

const DURATION = 8510
const SLIDE_IN_DURATION = 3500
const PAUSE = 3000
const SLIDE_IN = SLIDE_IN_DURATION / DURATION
const FADE_OUT_START = (PAUSE + SLIDE_IN_DURATION) / DURATION
const FADE_OUT_STOP = 1

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
    return (
      <View>
        <H2 ariaLevel={'2'} accessibilityRole={'heading'} style={[fonts.h2, styles.letsMake]}>
          A new story in
        </H2>
        <View style={styles.textContainer}>
          <View style={[styles.mask, styles.fadeOut]} key={`${this.state.currentWord}-mask1`} />
          <View style={[styles.mask2, styles.slideIn]} key={`${this.state.currentWord}-mask2`} />
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
    animationDuration: `${DURATION}ms`,
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
    animationDuration: `${DURATION}ms`,
    height: 45,
    bottom: 0,
    left: -20,
    right: 0,
    top: 8,
    position: 'absolute',
    backgroundColor: colors.white,
    animationIterationCount: 1,
  },
  fadeOut: {
    animationKeyframes: [
      {
        '0%': {
          opacity: 0,
          // transform: [
          //   {
          //     translateX: '-100%',
          //   },
          // ],
        },
        [`${FADE_OUT_START * 100}%`]: {
          opacity: 0,
          // transform: [
          //   {
          //     translateX: '-100%',
          //   },
          // ],
        },
        [`${FADE_OUT_STOP * 100}%`]: {
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
  },
  slideIn: {
    animationKeyframes: [
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
        [`${SLIDE_IN * 100}%`]: {
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
  },
})
