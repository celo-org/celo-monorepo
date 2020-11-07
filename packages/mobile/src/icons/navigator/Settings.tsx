import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

export function Settings() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M17 8.5H7.5a1.5 1.5 0 100 3H17v-3z"
        fill="#B4B9BD"
        stroke="#B4B9BD"
        strokeWidth={2}
      />
      <Path d="M14 24.5h9a2 2 0 002-2v0a2 2 0 00-2-2h-9" stroke="#B4B9BD" strokeWidth={2} />
      <Circle cx={21.5} cy={9.5} r={4.5} stroke="#B4B9BD" strokeWidth={2} />
      <Circle
        cx={10.5}
        cy={22.5}
        r={4.5}
        transform="rotate(-180 10.5 22.5)"
        stroke="#B4B9BD"
        strokeWidth={2}
      />
    </Svg>
  )
}

export default React.memo(Settings)
