import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  color: colors
  size: number
}

export default React.memo(function Checkmark({ color, size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 11 9" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.7932 1.85263L3.96211 8.64309L0.180176 4.88366L1.85967 3.19411L3.96211 5.28404L9.11373 0.163086L10.7932 1.85263Z"
        fill={color}
      />
    </Svg>
  )
})
