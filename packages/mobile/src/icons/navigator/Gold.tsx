import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function Gold() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M21.724 13.992v-.002a8.49 8.49 0 011.739-3.658c.801-.966 1.73-1.533 2.53-1.671l.034-.007.024-.005a.718.718 0 01.072 0h.028l.028-.003a2.097 2.097 0 011.702.686c.664.743 1.005 2.005.715 3.592h0l-.002.006c-.244 1.384-.855 2.654-1.657 3.61-.807.961-1.751 1.543-2.643 1.687-.78.118-1.423-.1-1.885-.595h0l-.007-.008c-.687-.72-1.02-2.007-.678-3.632z"
        stroke="#B4B9BD"
        strokeWidth={2}
      />
      <Path
        d="M3 20.375l6.308-8.834c.993-1.39 3.16-.976 3.57.684l2.795 11.348c.417 1.692 2.647 2.079 3.61.627L21 21.607"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(Gold)
