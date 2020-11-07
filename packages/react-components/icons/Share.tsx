import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

export interface Props {
  height?: number
  color?: string
  strokeWidth?: number
}

function Share({ color = colors.greenUI, height = 32, strokeWidth = 2.5 }: Props) {
  return (
    <Svg width={height} height={height} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 18V4M12 7l4-4 4 4M12.571 12H11a3 3 0 00-3 3v9a3 3 0 003 3h10a3 3 0 003-3v-9a3 3 0 00-3-3h-1.571"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

export default React.memo(Share)
