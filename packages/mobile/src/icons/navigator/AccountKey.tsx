import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

export function AccountKey() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M18.943 10.143a1 1 0 00-2 0h2zm-1 12.771h1a1 1 0 00-1-1v1zm0-11.828v1a1 1 0 001-1h-1zm-2-6.086H8v2h7.943V5zM8 29h7.943v-2H8v2zm-3-6.086V26h2v-3.086H5zM18.943 26v-3.086h-2V26h2zm-2-3.086v.315h2v-.315h-2zM6 23.914h11.943v-2H6v2zM16.943 8v3.086h2V8h-2zm2 3.086v-.943h-2v.943h2zM5 8v3.086h2V8H5zm0 3.086v11.828h2V11.086H5zm12.943-1h-6.286v2h6.286v-2zm-6.286 0H6v2h5.657v-2zM15.943 29a3 3 0 003-3h-2a1 1 0 01-1 1v2zM8 27a1 1 0 01-1-1H5a3 3 0 003 3v-2zM8 5a3 3 0 00-3 3h2a1 1 0 011-1V5zm7.943 2a1 1 0 011 1h2a3 3 0 00-3-3v2z"
        fill="#B4B9BD"
      />
      <Path
        d="M25 15.5h-6m-4 3v-3h4m0 0v3"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={27.5} cy={15.5} r={2.5} stroke="#B4B9BD" strokeWidth={2} />
    </Svg>
  )
}

export default React.memo(AccountKey)
