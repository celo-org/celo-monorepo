import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  size: number
}

export default React.memo(function ExchangeIconCGLD({ size }: Props) {
  return (
    <Svg width={`${size}px`} height={`${size}px`} viewBox="0 0 1000 1000">
      <desc>Symbol for the Celo cGLD Currency</desc>
      <Path fill="#FBCC5C" d="M0 0h1000v1000H0z" />
      <Path
        fill="#F9B73E"
        d="M453 778c104 0 196-69 226-170h-81c-25 57-82 94-145 94-88 0-159-71-159-159 0-63 37-120 94-145v-81c-101 30-170 122-170 226 0 129 106 235 235 235zm154-210c95 0 163-71 163-170v-35H603l-23 71h112c-6 35-41 62-83 62-61 0-105-45-105-108s45-108 108-108c36 0 65 9 104 31v-80c-32-15-68-23-104-23-102 0-183 80-182 180 1 103 77 180 177 180z"
      />
      <Path
        id="symbol-celo-gold"
        fill="#FFF"
        d="M453 768c98 0 181-63 212-150h-61c-27 56-85 94-151 94-93 0-169-76-169-169 0-66 38-124 94-151v-61c-87 31-150 114-150 212 0 124 101 225 225 225zm154-210c90 0 153-67 153-160v-25H610l-16 51h109c0 45-42 82-94 82-67 0-115-50-115-118s50-118 118-118c33 0 61 7 94 24v-57c-30-13-63-19-94-19-97 0-173 76-172 170 1 97 72 170 167 170z"
      />
    </Svg>
  )
})
