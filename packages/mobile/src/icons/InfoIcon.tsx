import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function InfoIcon({ size = 16, color = colors.dark }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Circle cx="8" cy="8" r="7" stroke={color} stroke-width="1.25" />
      <Path d="M8 12V7M8 6V5" stroke={color} stroke-width="1.25" />
    </Svg>
  )
}

export default React.memo(InfoIcon)
