import * as React from 'react'
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg'

export function Invite() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <G clipPath="url(#prefix__clip0)">
        <Path
          d="M22.564 12.903l2.775 2.501A2 2 0 0126 16.89V26a2 2 0 01-2 2H7a2 2 0 01-2-2v-9.047a2 2 0 01.74-1.553l3.078-2.497"
          stroke="#B4B9BD"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M26 17l-6.204 4m-8.878 0L5 17"
          stroke="#B4B9BD"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M5.247 26.81c-.37.409-.343 1.05.058 1.43a.97.97 0 001.395-.05l-1.453-1.38zm19.533 1.378a.97.97 0 001.395.055 1.03 1.03 0 00.046-1.43l-1.441 1.375zM18.736 21l.006 1.013L18.736 21zm-6.038 0l-.006-1.013.006 1.013zm-2.166-.046l-5.285 5.855L6.7 28.19l5.285-5.855-1.453-1.381zm2.173 1.059h6.037l-.013-2.026h-6.037l.013 2.026zm6.764.325l5.31 5.85 1.442-1.376-5.311-5.85-1.441 1.376zm-.727-.325c.275 0 .539.117.727.325l1.44-1.376a2.947 2.947 0 00-2.18-.975l.013 2.026zm-6.757.322a.97.97 0 01.72-.322l-.013-2.026c-.822 0-1.604.35-2.16.967l1.453 1.38z"
          fill="#B4B9BD"
        />
        <Path
          d="M13.103 9.348v-.002a8.487 8.487 0 011.739-3.656c.8-.966 1.73-1.533 2.528-1.672l.035-.006.024-.006a.773.773 0 01.071 0h.029l.028-.002a2.097 2.097 0 011.701.685c.665.743 1.005 2.004.715 3.591h0l-.001.006c-.245 1.384-.856 2.654-1.657 3.609-.807.961-1.751 1.543-2.642 1.687-.78.118-1.423-.1-1.885-.595h0l-.007-.007c-.687-.721-1.02-2.007-.678-3.632z"
          stroke="#B4B9BD"
          strokeWidth={2}
        />
      </G>
      <Defs>
        <ClipPath id="prefix__clip0">
          <Path d="M0 0h32v32H0V0z" fill="#fff" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default React.memo(Invite)
