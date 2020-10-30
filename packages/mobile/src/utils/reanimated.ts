import Animated, {
  and,
  block,
  Clock,
  clockRunning,
  cond,
  Easing,
  not,
  set,
  startClock,
  timing,
  Value,
} from 'react-native-reanimated'

export interface LoopProps {
  clock?: Animated.Clock
  easing?: Animated.EasingFunction
  duration?: number
  boomerang?: boolean
  autoStart?: boolean
}

// Courtesy of https://github.com/wcandillon/react-native-redash/blob/2728edb747f48d83e2127cd697ea759031ea3134/packages/core/src/AnimationRunners.ts#L217
// TODO: include the full react-native-redash lib if we start using more of it!
export const loop = (loopConfig: LoopProps) => {
  const { clock, easing, duration, boomerang, autoStart } = {
    clock: new Clock(),
    easing: Easing.linear,
    duration: 250,
    boomerang: false,
    autoStart: true,
    ...loopConfig,
  }
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
  }
  const config = {
    toValue: new Value(1),
    duration,
    easing,
  }

  return block([
    cond(and(not(clockRunning(clock)), autoStart ? 1 : 0), startClock(clock)),
    timing(clock, state, config),
    cond(state.finished, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      boomerang ? set(config.toValue, cond(config.toValue, 0, 1)) : set(state.position, 0),
    ]),
    state.position,
  ])
}
