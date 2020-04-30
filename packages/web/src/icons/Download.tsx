import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  color: colors
  size: number
}

export default React.memo(function Download({ color, size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 13" fill="none">
      <Path d="M0 12H10" stroke={color} strokeWidth="1.5" />
      <Path d="M5 0V9" stroke={color} strokeWidth="1.5" />
      <Path d="M1 5L5 9L9 5" stroke={color} strokeWidth="1.5" />
    </Svg>
  )
})
