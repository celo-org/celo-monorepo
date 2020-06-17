import * as React from 'react'
import { Line, Svg } from 'react-native-svg'

const Hamburger = () => {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Line
        x1="7.25"
        y1="9.75"
        x2="24.75"
        y2="9.75"
        stroke="#2E3338"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="15.75"
        x2="24.75"
        y2="15.75"
        stroke="#2E3338"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="7.25"
        y1="21.75"
        x2="24.75"
        y2="21.75"
        stroke="#2E3338"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(Hamburger)
