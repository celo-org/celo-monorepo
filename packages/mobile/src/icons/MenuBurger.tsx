import * as React from 'react'
import Svg, { G, Line, Rect } from 'svgs'

export default function MenuBurger() {
  return (
    <Svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <G filter="url(#filter0_d)">
        <Rect x="12" y="10" width="40" height="40" rx="4" fill="white" />
        <Line
          x1="23.25"
          y1="23.75"
          x2="40.75"
          y2="23.75"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="23.25"
          y1="29.75"
          x2="40.75"
          y2="29.75"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Line
          x1="23.25"
          y1="35.75"
          x2="40.75"
          y2="35.75"
          stroke="#2E3338"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </G>
      <defs>
        <filter
          id="filter0_d"
          x="0"
          y="0"
          width="64"
          height="64"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.611765 0 0 0 0 0.643137 0 0 0 0 0.662745 0 0 0 0.3 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </Svg>
  )
}
