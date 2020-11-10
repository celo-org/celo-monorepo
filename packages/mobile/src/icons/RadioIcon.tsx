import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle } from 'svgs'

interface Props {
  selected: boolean
  colorWhenSelected?: colors
}

export default function RadioIcon({ selected }: Props) {
  const color = selected ? colors.greenUI : colors.gray3
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" stroke={color} strokeWidth={2} />
      {selected && <Circle cx="10" cy="10" r="6" fill={color} />}
    </Svg>
  )
}
