import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  color?: colors
  size?: number
}

export default React.memo(function CopyIcon({ color, size }: Props) {
  const units = size || 16
  return (
    <Svg width={units} height={units} viewBox="0 0 16 16" fill="none">
      <Path
        d="M10.6666 0.666687H2.66659C1.93325 0.666687 1.33325 1.26669 1.33325 2.00002V11.3334H2.66659V2.00002H10.6666V0.666687ZM9.99992 3.33335H5.33325C4.59992 3.33335 4.00659 3.93335 4.00659 4.66669L3.99992 14C3.99992 14.7334 4.59325 15.3334 5.32659 15.3334H12.6666C13.3999 15.3334 13.9999 14.7334 13.9999 14V7.33335L9.99992 3.33335ZM5.33325 14V4.66669H9.33325V8.00002H12.6666V14H5.33325Z"
        fill={color || colors.dark}
      />
    </Svg>
  )
})
