import * as React from 'react'
import Svg, { G, Line } from 'svgs'

interface Props {
  height: number
  width: number
}

function MenuBurger({ height, width }: Props) {
  return (
    <Svg
      width={`${width}`}
      height={`${height}`}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <G filter="url(#filter0_d)">
        <Line
          x1="23.5"
          y1="26.5"
          x2="41"
          y2="26.5"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="23.5"
          y1="32.75"
          x2="41"
          y2="32.75"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="23.5"
          y1="39"
          x2="41"
          y2="39"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  )
}

export default React.memo(MenuBurger)
