import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export default function DownArrowIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M3 6l5 5 5-5" stroke={colors.gray3} />
    </Svg>
  )
}
