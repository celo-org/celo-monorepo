import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Animated from 'react-native-reanimated'
import Svg, { Path } from 'svgs'

const AnimatedPath = Animated.createAnimatedComponent(Path)

export interface Props {
  height?: number
  color?: string | Animated.Adaptable<number>
  strokeWidth?: number
}

function Times({ color, height, strokeWidth }: Props) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" height={height} width={height} viewBox="0 0 16 16">
      <AnimatedPath
        d="M13.9999 2.00146L1.99994 14.0015"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <AnimatedPath
        d="M1.99994 2.00146L13.9999 14.0015"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

Times.defaultProps = {
  height: 16,
  color: colors.dark,
  strokeWidth: 2,
}

export default React.memo(Times)
