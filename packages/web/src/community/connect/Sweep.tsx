import * as React from 'react'
import { StyleSheet, View } from 'react-native-web'
import VECTORS from 'src/community/connect/RingOfCoinVectors'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { G, Path } from 'src/shared/svg'
import { baseCoinStyle, colors, standardStyles } from 'src/styles'
import Svg from 'svgs'

// note this is the animation duration of a single coin,
// since the coins animate in a delayed way the entire "animation" is longer than this
const DURATION = 1500

const INTERVAL_MS = DURATION * 4 // needs to be at least 4x DURATION to give the complete animation a chance to finish

interface OwnProps {
  children: React.ReactNode
}
interface State {
  animating: boolean
}

type Props = OwnProps & ScreenProps
class Sweep extends React.Component<Props, State> {
  timer: number
  state = {
    animating: true,
  }

  componentDidMount = () => {
    this.timer = setInterval(this.tick, INTERVAL_MS)
  }
  componentWillUnmount = () => {
    clearInterval(this.timer)
  }

  tick = () => {
    this.setState((state) => ({ animating: !state.animating }))
  }
  play = () => {
    this.setState({ animating: true })
  }

  render() {
    const frame = DURATION / VECTORS.length
    const isMobile = this.props.screen === ScreenSizes.MOBILE

    return (
      <View style={isMobile ? styles.mobileSweepContainer : styles.sweepContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 717 750" fill="none">
          <G style={this.state.animating ? styles.lighting : styles.lightingOff}>
            {VECTORS.map((path, index) => {
              const style = {
                animationDelay: `${index * frame}ms`,
              }

              return (
                <Path
                  key={path.slice(0, 10)}
                  d={path}
                  style={[styles.base, this.state.animating && styles.cycle, baseCoinStyle, style]}
                />
              )
            })}
          </G>
          <StableCircle />
        </Svg>
        <View style={isMobile ? standardStyles.centered : styles.absoluteCenter}>
          {this.props.children}
        </View>
      </View>
    )
  }
}

export default withScreenSize(Sweep)

class StableCircle extends React.PureComponent {
  render() {
    return (
      <G>
        {VECTORS.map((path) => {
          return (
            <Path
              key={path.slice(0, 11)}
              d={path}
              style={[styles.justCoin, { stroke: colors.screenGray }, baseCoinStyle]}
            />
          )
        })}
      </G>
    )
  }
}

const styles = StyleSheet.create({
  justCoin: {
    opacity: 0.5,
    fill: 'transparent',
  },
  base: {
    opacity: 0.5,
    animationIterationCount: '3',
    animationDuration: `${DURATION}ms`,
    animationFillMode: 'both',
    animationDirection: 'normal',
  },
  cycle: {
    animationKeyframes: getKeyframes(),
  },
  sweepContainer: {
    height: 1000,
    width: '100%',
  },
  mobileSweepContainer: {
    height: '180vw',
    width: '100%',
  },
  lightingOff: {
    opacity: 0,
  },
  lighting: {
    height: 1000,
    width: '100%',
    animationIterationCount: '1',
    animationDuration: `${DURATION * 2}ms`,
    animationDelay: `${DURATION}ms`,
    animationFillMode: 'both',
    animationKeyframes: [
      {
        '0%': {
          opacity: 0,
        },
        '60%': {
          opacity: 0.9,
        },
        '100%': {
          opacity: 0,
        },
      },
    ],
  },
  absoluteCenter: {
    position: 'absolute', // TODO only absolute on desktop not mobile
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

const standard = {
  stroke: colors.screenGray,
  fill: 'transparent',
}

function getKeyframes() {
  return [
    {
      '0%': standard,
      '24%': standard,

      '25%': colorFrame(colors.greenScreen),
      '35%': colorFrame(colors.greenScreen),

      '40%': colorFrame(colors.redScreen),
      '54%': colorFrame(colors.redScreen),

      '55%': colorFrame(colors.blueScreen),
      '69%': colorFrame(colors.blueScreen),

      '70%': colorFrame(colors.purpleScreen),
      '80%': colorFrame(colors.purpleScreen),

      '85%': standard,
      '100%': standard,
    },
  ]
}

function colorFrame(color: colors) {
  return {
    stroke: color,
    fill: color,
  }
}
