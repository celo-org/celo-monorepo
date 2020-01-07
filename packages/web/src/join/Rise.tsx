import * as React from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import OvalCoin from 'src/shared/OvalCoin'
import { colors } from 'src/styles'
import { randomIntegerInRange } from 'src/utils/utils'

// colors are duplicated to increase chance they will be picked
const COLORS = [
  colors.primary,
  colors.inactive,
  colors.inactive,
  colors.primary,
  colors.primaryHover,
  colors.primary,
  colors.purple,
  colors.primary,
  colors.primary,
  colors.red,
  colors.lightBlue,
  colors.orange,
]

interface State {
  width: number
  height: number
  willAnimate: boolean
}

interface RisingCoinProps {
  color: colors
  windowWidth: number
  windowHeight: number
  duration: number
  delay: number
  willFall?: boolean
  willAnimate: boolean
}

interface StateVectors {
  vx: number
  vy: number
  radius: number
  x: number
  y: number
}

const VERTICAL_DISTANCE_MAX = 400
const VERTICAL_DISTANCE_MIN = 300
const HORIZONTAL_DISTANCE_MAX = 200
const HORIZONTAL_DISTANCE_MIN = 100
const MIN_DURATION_SECONDS = 8
const MAX_DURATION_SECONDS = 12
const MIN_DURATION_FALL_SECONDS = 8
const MAX_DURATION_FALL_SECONDS = 10
const COIN_COUNT_DIVISOR = 11
const MIN_COIN_SIZE = 6
const MAX_COIN_SIZE = 8
const COIN_SIZE_MULTIPLIER = 3
const DELAY_FACTOR = 11
const NUMBER_OF_LOOPS = 3
const BIAS_START_DOWN_RATIO = 0.9

const PEAK_OPACITY = 0.9
const MID_POINT_OPACITY = 0.8
const LOW_POINT_OPACITY = 0
const JITTER = 1

function getPosition(radius: number, maximum: number) {
  const coinPadding = radius * 2
  return randomIntegerInRange(coinPadding, maximum - coinPadding)
}

function spawn({ windowHeight, windowWidth }): StateVectors {
  const radius = COIN_SIZE_MULTIPLIER * randomIntegerInRange(MIN_COIN_SIZE, MAX_COIN_SIZE)
  const x = getPosition(radius, windowWidth)
  const y = getPosition(radius, windowHeight)
  const vx = randomIntegerInRange(HORIZONTAL_DISTANCE_MIN, HORIZONTAL_DISTANCE_MAX)
  const vy = radius + randomIntegerInRange(VERTICAL_DISTANCE_MIN, VERTICAL_DISTANCE_MAX)
  return { x, y, vx, vy, radius }
}

function getRandomColor(): colors {
  return COLORS[randomIntegerInRange(0, COLORS.length - 1)]
}

interface Props {
  willFall?: boolean
}

interface Coord {
  x: number
  y: number
}

export default class Rise extends React.PureComponent<Props, State> {
  state = {
    width: 0,
    height: 0,
    willAnimate: false,
  }

  componentDidMount() {
    // deviceMemory is only supported by chrome / android + opera
    if (!window.navigator.deviceMemory || window.navigator.deviceMemory > 2) {
      this.setState({ willAnimate: true })
    }

    this.windowResize({ window: Dimensions.get('window') })
    Dimensions.addEventListener('change', this.windowResize)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.windowResize)
  }

  windowResize = ({ window: { width, height } }) => {
    this.setState({ width, height })
  }

  getDuration = () => {
    return this.props.willFall
      ? randomIntegerInRange(MIN_DURATION_FALL_SECONDS, MAX_DURATION_FALL_SECONDS)
      : randomIntegerInRange(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS) * NUMBER_OF_LOOPS
  }

  render() {
    const { width, height } = this.state

    if (width === 0 || height === 0) {
      return null
    }
    const numberOfCoins = Math.floor(
      Math.max(width / COIN_COUNT_DIVISOR, height / COIN_COUNT_DIVISOR)
    )

    const coins = Array(numberOfCoins)
      .fill(null)
      .map((_, i) => {
        const duration = this.getDuration()

        const delayMS = randomIntegerInRange(i * 1.5, i * 1.5 * Math.log(i)) * DELAY_FACTOR

        return (
          <RisingCoin
            key={i}
            willAnimate={this.state.willAnimate}
            willFall={this.props.willFall}
            windowHeight={height}
            windowWidth={width}
            color={getRandomColor()}
            duration={duration}
            delay={delayMS}
          />
        )
      })
    return <View style={[styles.container, { maxHeight: height, maxWidth: width }]}>{coins}</View>
  }
}

function jitter({ x, y }: Coord) {
  return {
    x: randomIntegerInRange(x, x + JITTER),
    y: randomIntegerInRange(y - JITTER + 1, y + JITTER + 1),
  }
}

// tslint:disable-next-line:max-classes-per-file
class RisingCoin extends React.PureComponent<RisingCoinProps, StateVectors> {
  constructor(props: RisingCoinProps) {
    super(props)
    this.state = spawn(props)
  }
  getTransformStart = ({ x, y }: Coord) => {
    return [{ translateX: x }, { translateY: y }]
  }
  getTransformEnd = ({ x, y }: Coord) => {
    return [{ translateX: x + this.state.vx }, { translateY: y - this.state.vy }]
  }
  getTransformMidpoint = ({ x, y }: Coord, percent: number) => {
    return [
      {
        translateX: x + this.state.vx * percent,
      },
      {
        translateY: y - this.state.vy * percent,
      },
    ]
  }

  fall = ({ x }) => {
    return { x, y: this.props.windowHeight + this.state.vy }
  }

  getStyleAndPosition = () => {
    if (!this.props.willAnimate) {
      return {
        opacity: 0.7,
        animationPlaystate: 'paused',
        transform: this.getTransformStart({ x: this.state.x, y: this.state.y }),
      }
    }

    const secondXPosition =
      getPosition(this.state.radius, this.props.windowWidth * BIAS_START_DOWN_RATIO) -
      HORIZONTAL_DISTANCE_MIN
    const secondYPosition =
      getPosition(this.state.radius, this.props.windowHeight * BIAS_START_DOWN_RATIO) -
      VERTICAL_DISTANCE_MIN
    const thirdXPosition =
      getPosition(this.state.radius, this.props.windowWidth * BIAS_START_DOWN_RATIO) -
      HORIZONTAL_DISTANCE_MIN
    const thirdYPosition =
      getPosition(this.state.radius, this.props.windowHeight * BIAS_START_DOWN_RATIO) -
      VERTICAL_DISTANCE_MIN

    const firstCoord = {
      y: this.state.y,
      x: this.state.x,
    }
    const secondCoord = { y: secondYPosition, x: secondXPosition }

    const thirdCoord = { y: thirdYPosition, x: thirdXPosition }

    // each roughly 33% is a ""full"" animation of a coin gliding up, the coin then turns invisible jumps to a new predetermined pseudo-random position and glides up again. it repeats this 2 before going back to its original position and starting again
    return {
      animationDelay: `${this.props.delay}ms`,
      animationDuration: `${this.props.duration}s`,
      animationFillMode: 'both' as 'both',
      animationKeyframes: [
        {
          ...this.keyframes(firstCoord, secondCoord, thirdCoord),
        },
      ],
    }
  }

  keyframes = (firstCoord: Coord, secondCoord: Coord, thirdCoord: Coord) => {
    return this.props.willFall
      ? this.fallFrames(firstCoord)
      : this.riseFrames(firstCoord, secondCoord, thirdCoord)
  }

  riseFrames = (firstCoord: Coord, secondCoord: Coord, thirdCoord: Coord) => {
    return {
      '0%': { opacity: LOW_POINT_OPACITY, transform: this.getTransformStart(firstCoord) },
      '5%': { opacity: MID_POINT_OPACITY },
      '16%': { opacity: PEAK_OPACITY },
      '28%': { opacity: MID_POINT_OPACITY },
      '33%': { opacity: LOW_POINT_OPACITY, transform: this.getTransformEnd(firstCoord) },
      '33.001%': {
        opacity: LOW_POINT_OPACITY,
        transform: this.getTransformStart(secondCoord),
      },
      '40%': { opacity: MID_POINT_OPACITY },
      '49%': { opacity: PEAK_OPACITY },
      '60%': { opacity: MID_POINT_OPACITY },
      '66%': {
        opacity: LOW_POINT_OPACITY,
        transform: this.getTransformEnd(secondCoord),
      },
      '66.001%': {
        opacity: LOW_POINT_OPACITY,
        transform: this.getTransformStart(thirdCoord),
      },
      '70%': { opacity: MID_POINT_OPACITY },
      '82%': { opacity: PEAK_OPACITY },
      '97%': { opacity: MID_POINT_OPACITY },
      '99%': {
        opacity: LOW_POINT_OPACITY,
        transform: this.getTransformEnd(thirdCoord),
      },
      '100%': { transform: this.getTransformStart(firstCoord), opacity: LOW_POINT_OPACITY },
    }
  }
  fallFrames = ({ x, y: originalY }: Coord) => {
    const y = originalY + this.props.windowHeight * 0.2
    return {
      '0%': {
        opacity: LOW_POINT_OPACITY,
        transform: this.getTransformStart({ x, y }),
      },
      '10%': { opacity: MID_POINT_OPACITY },

      '49%': { transform: this.getTransformMidpoint(jitter({ x, y }), 0.98) },
      '49.25%': { transform: this.getTransformMidpoint(jitter({ x, y }), 0.982) },
      '49.5%': {
        opacity: MID_POINT_OPACITY,
        transform: this.getTransformMidpoint(jitter({ x, y }), 0.98),
      },
      // fall starts
      '50%': {
        animationPlaystate: 'paused',
        transform: this.getTransformEnd({ x, y }),
        animationTimingFunction: 'cubic-bezier(1,.03,1,1.45)',
      },
      '99.9%': {
        opacity: MID_POINT_OPACITY,
        transform: this.getTransformEnd(this.fall({ x })),
      },
      '100%': { opacity: 0, transform: this.getTransformEnd(this.fall({ x })) },
    }
  }

  getHollowCoinStyle(color: colors) {
    return {
      opacity: 1,
      strokeWidth: '8px',
      strokeLinecap: 'round',
      animationTimingFunction: 'ease-out',
      animationDelay: `${this.props.delay}ms`,
      animationDuration: `${this.props.duration}s`,
      animationFillMode: 'both',
      animationKeyframes: [
        {
          '0%': {
            stroke: color,
            fill: color,
          },
          '90%': {
            stroke: color,
            fill: color,
          },
          '91%': {
            stroke: color,
            fill: 'transparent',
          },
          '100%': {
            stroke: colors.gray,
            fill: 'transparent',
          },
        },
      ],
    }
  }

  render() {
    return (
      <View
        style={[
          styles.coin,
          this.props.willFall ? styles.coinFall : styles.coinRise,
          this.getStyleAndPosition(),
        ]}
      >
        <OvalCoin
          style={this.props.willFall && this.getHollowCoinStyle(this.props.color)}
          color={this.props.color}
          size={this.state.radius}
          viewBox="-10 -10 90 115"
          mixBlendMode={'screen'}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    zIndex: -1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  coin: {
    position: 'absolute',
    opacity: 0,
  },
  coinRise: {
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in',
  },
  coinFall: {
    animationIterationCount: 1,
    animationTimingFunction: 'ease-out',
  },
})
