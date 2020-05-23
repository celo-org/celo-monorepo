import * as React from 'react'
import Svg, { G, Line } from 'svgs'

interface Props {
  height: number
  width: number
}

export default function MenuBurger({ height, width }: Props) {
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
          x1="24"
          y1="26.25"
          x2="41"
          y2="26.25"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="24"
          y1="32.5"
          x2="41"
          y2="32.5"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="24"
          y1="38.75"
          x2="41"
          y2="38.75"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  )
}
