import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native-web'
import VECTORS from 'src/community/connect/RingOfCoinVectors'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { G, Path } from 'src/shared/svg'
import { baseCoinStyle, colors, standardStyles } from 'src/styles'
import Svg from 'svgs'

// note this is the animation duration of a single coin,
// since the coins animate in a delayed way the entire "animation" is longer than this
const DURATION = 1100

const INTERVAL_MS = DURATION * 2.1

interface OwnProps {
  static: boolean
  children?: React.ReactNode
  mobileContainerStyle: ViewStyle | ViewStyle[]
}
type Props = OwnProps & ScreenProps
class PinWheel extends React.Component<Props> {
  render() {
    const frame = DURATION / VECTORS.length
    const isMobile = this.props.screen === ScreenSizes.MOBILE

    return (
      <View style={isMobile ? this.props.mobileContainerStyle : styles.sweepContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 717 750" fill="none">
          {!this.props.static && (
            <G style={styles.lighting}>
              {VECTORS.map((path, index) => {
                const style = {
                  animationDelay: `${index * frame}ms`,
                }

                return (
                  <Path
                    key={path.slice(0, 10)}
                    d={path}
                    style={[styles.base, styles.cycle, baseCoinStyle, style]}
                  />
                )
              })}
            </G>
          )}
          <Quadrants animate={!this.props.static} />
        </Svg>
        {this.props.children && (
          <View style={isMobile ? standardStyles.centered : styles.absoluteCenter}>
            {this.props.children}
          </View>
        )}
      </View>
    )
  }
}

export default withScreenSize(PinWheel)

interface QuadrantProps {
  animate: boolean
}
class Quadrants extends React.PureComponent<QuadrantProps> {
  render() {
    return (
      <G>
        {VECTORS.map((path, index) => {
          return (
            <Path
              key={path.slice(0, 11)}
              d={path}
              style={[styles.justCoin, this.props.animate ? animated(index) : still(index)]}
            />
          )
        })}
      </G>
    )
  }
}

const DELAYMENT = 30
const QUARTERIZER = 200

function animated(index: number) {
  return {
    mixBlendMode: 'screen',
    animationIterationCount: 1,
    animationDelay: `${INTERVAL_MS + index * DELAYMENT}ms`,
    animationFillMode: 'both',
    animationDuration: `${DURATION / 3}ms`,
    animationKeyframes: solidFadeInFrames(
      quartColor(index),
      ((index * index) / VECTORS.length) * QUARTERIZER
    ),
  }
}

function still(index: number) {
  return {
    mixBlendMode: 'screen',
    ...colorFrame(quartColor(index)),
  }
}

function quartColor(index: number) {
  const quarter = VECTORS.length / 4
  if (index < quarter) {
    return colors.greenScreen
  } else if (index < quarter * 2) {
    return colors.purpleScreen
  } else if (index < quarter * 3) {
    return colors.blueScreen
  } else {
    return colors.redScreen
  }
}

const standardStrokeFill = {
  fill: 'transparent',
}

const KEY_FRAMES = [
  {
    '0%': standardStrokeFill,
    '24%': standardStrokeFill,

    '25%': colorFrame(colors.greenScreen),
    '35%': colorFrame(colors.greenScreen),

    '40%': colorFrame(colors.redScreen),
    '54%': colorFrame(colors.redScreen),

    '55%': colorFrame(colors.blueScreen),
    '69%': colorFrame(colors.blueScreen),

    '70%': colorFrame(colors.purpleScreen),
    '80%': colorFrame(colors.purpleScreen),

    '85%': standardStrokeFill,
    '100%': standardStrokeFill,
  },
]

const styles = StyleSheet.create({
  justCoin: {
    opacity: 0.3,
    fill: 'transparent',
  },
  base: {
    opacity: 0.2,
    animationIterationCount: 3,
    animationDuration: `${DURATION}ms`,
    animationFillMode: 'both',
    animationDirection: 'normal',
  },
  cycle: {
    animationKeyframes: KEY_FRAMES,
  },
  sweepContainer: {
    width: '100%',
    height: '100vh',
    maxHeight: '100vw',
    maxWidth: '90vw',
  },
  lightingOff: {
    opacity: 0,
  },
  lighting: {
    height: '100%',
    width: '100%',
    animationIterationCount: 1,
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
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

function solidFadeInFrames(color: colors, donePercent: number) {
  return [{ '0%': standardStrokeFill, [donePercent]: colorFrame(color), '100%': colorFrame(color) }]
}

function colorFrame(color: colors) {
  return {
    stroke: color,
    fill: color,
  }
}
