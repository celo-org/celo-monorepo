import { processColor } from 'react-native'
import Animated, { color, Extrapolate, interpolate, round } from 'react-native-reanimated'

// tslint:disable: no-bitwise
function red(c) {
  return (c >> 16) & 255
}
function green(c) {
  return (c >> 8) & 255
}
function blue(c) {
  return c & 255
}
function opacity(c) {
  return ((c >> 24) & 255) / 255
}
// tslint:enable: no-bitwise

/**
 * Use this if you want to interpolate an `Animated.Value` into color values.
 *
 * #### Why is this needed?
 *
 * Unfortunately, if you'll pass color values directly into the `outputRange` option
 * of `interpolate()` function, that won't really work (at least at the moment).
 * See https://github.com/software-mansion/react-native-reanimated/issues/181 .
 *
 * So, for now you can just use this helper instead.
 */
export default function interpolateColors(
  animationValue: Animated.Adaptable<number>,
  options: {
    inputRange: ReadonlyArray<Animated.Adaptable<number>>
    outputColorRange: Array<string | number>
  }
) {
  const { inputRange, outputColorRange } = options
  const colors = outputColorRange.map(processColor)

  console.log('==colors', colors)

  const r = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(red),
      extrapolate: Extrapolate.CLAMP,
    })
  )
  const g = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(green),
      extrapolate: Extrapolate.CLAMP,
    })
  )
  const b = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(blue),
      extrapolate: Extrapolate.CLAMP,
    })
  )
  const a = interpolate(animationValue, {
    inputRange,
    outputRange: colors.map(opacity),
    extrapolate: Extrapolate.CLAMP,
  })

  return color(r, g, b, a)
}
