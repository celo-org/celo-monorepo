import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { H2 } from 'src/fonts/Fonts'
import { colors, fonts, textStyles } from 'src/styles'

const words = ['finance', 'saving', 'education', 'sending', 'giving', 'lending', 'regeneration']

const textTransitionTime = 800

const timings = {
  finance: {
    length: 6000,
    pause: 150,
  },
  saving: {
    length: 4900,
    pause: 150,
  },
  education: {
    length: 5000,
    pause: 150,
  },
  sending: {
    length: 5000,
    pause: 150,
  },
  giving: {
    length: 4500,
    pause: 150,
  },
  lending: {
    length: 4700,
    pause: 150,
  },
  regeneration: {
    length: 4800,
    pause: 150,
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
    const word = words[this.state.currentWord]
    const duration = timings[word].length + timings[word].pause
    this.timeout = setTimeout(() => {
      if (this.state.currentWord !== words.length - 1) {
        this.setState({ currentWord: (this.state.currentWord + 1) % words.length, initial: false })
        this.changeWord()
      } else {
        this.setState({ currentWord: 0 })
        this.changeWord()
      }
    }, duration)
  }

  render() {
    const word = words[this.state.currentWord]

    const fadeOut: ViewStyle = this.props.playing
      ? {
          animationDuration: animations[word].duration,
          animationKeyframes: animations[word].out,
        }
      : {}

    const fadeIn: ViewStyle = this.props.playing
      ? {
          animationDuration: animations[word].duration,
          animationKeyframes: animations[word].in,
        }
      : {}

    return (
      <View style={styles.textContainer}>
        <>
          <H2 ariaLevel={'2'} accessibilityRole={'heading'} style={[fonts.h2, styles.letsMake]}>
            A new story in
          </H2>
          <View>
            <View style={[styles.mask, fadeOut]} key={`${this.state.currentWord}-mask1`} />
            <View style={[styles.mask2, fadeIn]} key={`${this.state.currentWord}-mask2`} />
            <H2 ariaLevel={'2'} accessibilityRole={'heading'} style={[fonts.h2, textStyles.heavy]}>
              {words[this.state.currentWord]}
            </H2>
          </View>
        </>
      </View>
    )
  }
}

export default TextAnimation

const styles = StyleSheet.create({
  textContainer: {},
  letsMake: {
    zIndex: 1,
  },
  mask: {
    height: 60,
    bottom: 0,
    left: 0,
    right: -30,
    top: 0,
    position: 'absolute',
    animationIterationCount: 1,
    backgroundColor: colors.white,
  },
  mask2: {
    bottom: 0,
    left: -20,
    right: 0,
    top: 0,
    position: 'absolute',
    backgroundColor: colors.white,
    animationIterationCount: 1,
  },
})
