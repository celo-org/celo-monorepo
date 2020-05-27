import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function AddWithdraw() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M23 22V9m0 0l-4 4m4-4l4 4M10 9v13m0 0l4-4m-4 4l-4-4"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(AddWithdraw)
