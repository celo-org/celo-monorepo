import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Path, Rect } from 'svgs'

export default React.memo(function AudioIcon() {
  return (
    <Svg width="31" height="32" viewBox="0 0 31 32" fill="none">
      <Rect y="10" width="9" height="12" fill={colors.primary} />
      <Path d="M6.66667 10.1666L16.6667 1.83325V30.1666L6.66667 21.8333V10.1666Z" fill="#35D07F" />
      <Path
        d="M20 23.5C21.6667 22.6667 24.1667 20.1421 24.1667 16C24.1667 11.8579 21.6667 9.33333 20 8.5"
        stroke={colors.primary}
        strokeWidth="2"
      />
      <Path
        d="M20 31C24 29.3333 30 24.2843 30 16C30 7.71573 24 2.66667 20 1"
        stroke={colors.primary}
        strokeWidth="2"
      />
    </Svg>
  )
})
