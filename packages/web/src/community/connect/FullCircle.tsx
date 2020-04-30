import * as React from 'react'
import { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native-web'
import shuffleSeed from 'shuffle-seed'
import VECTORS from 'src/community/connect/RingOfCoinVectors'
import { Path } from 'src/shared/svg'
import { baseCoinStyle, baseCoinStyleLight, colors } from 'src/styles'
import { randomIntegerInRange } from 'src/utils/utils'
import Svg from 'svgs'

const COLORS = [colors.greenScreen, colors.blueScreen, colors.redScreen, colors.purpleScreen]
const STILL_COLORS = [colors.lightBlue, colors.redScreen, colors.purple, colors.greenScreen]
const DURATION_MS = 1700
const PAUSE = 200 // milliseconds between coins fading in and out

const SPACE_BETWEEN = 4 // every X rings are colored in when multiple fade in together

const PRELIMINARY = 20 // percent thru keyframes when coin stroke comes on fully
const PEAK = 60 // percent thru keyframes where coin is at its peak brightness

const BEAT_COUNT = 4 // musically this is like the notes in a bar or a cycle. on the BEAT_COUNT fade in together and we start the next iteration

const MAX_DISTANCE = VECTORS.length - 1
const JUMP_THIRD = Math.floor(MAX_DISTANCE / 3) // these are for finding the next coin to animate
const JUMP_HALF = Math.floor(MAX_DISTANCE / 2)

const WAIT_TO_PLAY_MS = 400

interface State {
  lastPlayingIndex: number // key animating coin index from VECTORS last render/beat, to avoid using again in next render/beat
  playingIndexes: Set<number> // which index from the VECTORS array have animating coins this render/beat
  beatCycleIndex: number // refers to the 4 count beat of solo | solo | solo | together which coins fade in on
  duration: number
  color: colors
}

interface Props {
  init?: () => void
  lightBackground: boolean
  stillMode?: boolean
}

export default class FullCircle extends React.PureComponent<Props, State> {
  clock: number
  state = {
    lastPlayingIndex: randomIntegerInRange(0, VECTORS.length - 1),
    playingIndexes: new Set<number>(),
    beatCycleIndex: 0,
    duration: DURATION_MS,
    color: colors.greenScreen,
  }

  componentDidMount = () => {
    if (!this.props.stillMode) {
      if (this.props.init) {
        this.props.init()
      }
      this.clock = setTimeout(() => this.setPlaying(), WAIT_TO_PLAY_MS)
    } else {
      this.setStill()
    }
  }

  componentWillUnmount = () => {
    clearTimeout(this.clock)
  }

  setStill = () => {
    this.setState(() => {
      const nextRingIndex = 50
      return {
        playingIndexes: new Set(getTogetherIndexes(nextRingIndex)),
        beatCycleIndex: 0,
        lastPlayingIndex: nextRingIndex,
        duration: 1000000,
        color: pickRandom(COLORS),
      }
    })
  }

  setPlaying = () => {
    this.setState(setFrame)
    this.clock = setTimeout(this.setPlaying, this.state.duration + PAUSE)
  }

  getColor = (colorArray: colors[], colorIndex: number) => {
    return isTogetherBeat(this.state.beatCycleIndex) ? colorArray[colorIndex] : this.state.color
  }

  render() {
    let colorIndex = -1
    const colorArray = this.props.stillMode
      ? STILL_COLORS
      : shuffleSeed.shuffle(COLORS, this.state.lastPlayingIndex)
    return (
      <Svg width="100%" height="100%" viewBox="0 0 717 750" fill="none">
        {VECTORS.map((path, index) => {
          const playing = this.state.playingIndexes.has(index)
          if (playing) {
            colorIndex++
          }
          const style = ringStyle({
            color: playing ? this.getColor(colorArray, colorIndex) : 'transparent',
            duration: this.state.duration,
            lightBackground: this.props.lightBackground,
            playing,
            stillMode: this.props.stillMode,
          })
          return <Path key={path} d={path} style={style} />
        })}
      </Svg>
    )
  }
}

function setFrame(state: State): State {
  const lastPlayingIndex = state.lastPlayingIndex
  const beatCycleIndex = state.beatCycleIndex + 1
  const isNowTogetherBeat = isTogetherBeat(beatCycleIndex) // are multiple fading in together
  const nextRingIndex = nextSoloIndex(lastPlayingIndex, isNowTogetherBeat) // determine which will be the index of the next key animated coin
  const nextRingIndexes = isNowTogetherBeat ? getTogetherIndexes(nextRingIndex) : [nextRingIndex]

  // color isnt used when it's a together beat
  let newColor = !isNowTogetherBeat ? pickRandom(COLORS) : state.color
  // ensure that we dont accidentally draw the same color twice in a row
  while (!isNowTogetherBeat && newColor === state.color) {
    newColor = pickRandom(COLORS)
  }

  return {
    playingIndexes: new Set(nextRingIndexes),
    beatCycleIndex,
    lastPlayingIndex: nextRingIndex,
    duration: isNowTogetherBeat ? DURATION_MS * 2 : DURATION_MS,
    color: newColor,
  }
}

function pickRandom(array: any[]) {
  return array[randomIntegerInRange(0, array.length - 1)] || pickRandom(array)
}

function getKeyframes({ color }: { color: colors | 'transparent' }) {
  const fullOn = {
    opacity: 0.95,
    fill: color,
    stroke: color,
  }

  const strokeFull = {
    stroke: color,
  }

  const normal = {
    stroke: colors.screenGray,
    fill: 'transparent',
  }

  return [
    {
      '0%': normal,
      [`${PRELIMINARY}%`]: strokeFull,
      [`${PEAK}%`]: fullOn,
      '100%': normal,
    },
  ]
}

// from one fading in coin around the circle to the next fading in coin
const SOLO_JUMP_DISTANCES = [
  -JUMP_THIRD + 5,
  JUMP_THIRD + SPACE_BETWEEN,
  JUMP_HALF + 3,
  JUMP_HALF + JUMP_THIRD - 7,
  -(JUMP_HALF + JUMP_THIRD),
]

// from last fading in coin around the circle to the group of 4 fading in coins
const TOGETHER_JUMP_DISTANCES = [JUMP_HALF, JUMP_THIRD + SPACE_BETWEEN * 2]

// coins fade in either solo or together, either way we get an index sufficiently far away from the previous
// while considering that jumping half way around twice will get us right back home
// the intent is something that "feels" random, in that it jumps around and idealy doesnt hit nieghbours too close
// nor does it come back to a recently "awakened" coin too soon
function nextSoloIndex(last: number, isTogether: boolean): number {
  // distance refers to difference in of one index of VECTORS array to the next index
  const possibleDistancesToNextIndex = isTogether ? TOGETHER_JUMP_DISTANCES : SOLO_JUMP_DISTANCES

  let nextIndex = last + pickRandom(possibleDistancesToNextIndex)

  if (nextIndex > MAX_DISTANCE) {
    nextIndex = nextIndex - MAX_DISTANCE
  }

  if (nextIndex < 0) {
    nextIndex = nextIndex + MAX_DISTANCE - 1
  }

  return nextIndex
}

// when multiple coins are fading in at same time they get a distance in coins between them of SPACE_BETWEEN
// this determins what the exact index are taking into account that we can have it be less than 0 or greater than the number of coins in the array
function getTogetherIndexes(initial: number) {
  let base: number = initial

  if (base + SPACE_BETWEEN * 2 > VECTORS.length - 1) {
    base = initial - SPACE_BETWEEN * 2
  } else if (base - SPACE_BETWEEN < 0) {
    base = base + SPACE_BETWEEN
  }

  return [base - SPACE_BETWEEN, base, base + SPACE_BETWEEN, base + SPACE_BETWEEN * 2]
}

// a together beat is when multiple coins fade in together
function isTogetherBeat(beat: number) {
  return beat % BEAT_COUNT === 0
}

interface RingStyle {
  color: colors | 'transparent'
  playing: boolean
  duration: number
  lightBackground: boolean
  stillMode: boolean
}

function ringStyle({ color, playing, duration, lightBackground, stillMode }: RingStyle) {
  const styleArray: ViewStyle[] = [
    styles.normal,
    stillMode
      ? { stroke: '#CFCFCF', mixBlendMode: 'multiply' }
      : lightBackground
      ? baseCoinStyleLight
      : baseCoinStyle,
  ]

  if (stillMode && playing) {
    styleArray.push({
      opacity: 0.9,
      fill: color,
      // @ts-ignore
      stroke: color,
      mixBlendMode: 'multiply',
    })
  } else if (playing) {
    styleArray.push(styles.animatedBase, {
      animationDuration: `${duration}ms`,
      animationKeyframes: getKeyframes({ color }),
    })
  }
  return styleArray
}

const styles = StyleSheet.create({
  animatedBase: {
    animationIterationCount: 1,
    animationTimingFunction: 'ease-in',
    willChange: 'fill',
  },
})
