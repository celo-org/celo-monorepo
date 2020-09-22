import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

export enum LogoTypes {
  COLOR = 'COLOR',
  DARK = 'DARK',
  LIGHT = 'LIGHT',
}

interface Props {
  height?: number
  type?: LogoTypes
}

export default function Logo({ height = 25, type = LogoTypes.COLOR }: Props) {
  let mainColor
  switch (type) {
    case LogoTypes.DARK:
      mainColor = colors.dark
      break
    case LogoTypes.LIGHT:
      mainColor = colors.light
      break
    default:
      break
  }

  return (
    <Svg width={height} height={height} viewBox="0 0 25 25" fill="none">
      <Path
        d="M9.86842 22.3684C13.8653 22.3684 17.1053 19.1284 17.1053 15.1316C17.1053 11.1348 13.8653 7.89476 9.86842 7.89476C5.87158 7.89476 2.63158 11.1348 2.63158 15.1316C2.63158 19.1284 5.87158 22.3684 9.86842 22.3684ZM9.86842 25C4.41842 25 0 20.5816 0 15.1316C0 9.6816 4.41842 5.26318 9.86842 5.26318C15.3184 5.26318 19.7368 9.6816 19.7368 15.1316C19.7368 20.5816 15.3184 25 9.86842 25Z"
        fill={type === LogoTypes.COLOR ? colors.goldBrand : mainColor}
      />
      <Path
        d="M15.1316 17.1053C19.1284 17.1053 22.3684 13.8653 22.3684 9.86842C22.3684 5.87158 19.1284 2.63158 15.1316 2.63158C11.1348 2.63158 7.89476 5.87158 7.89476 9.86842C7.89476 13.8653 11.1348 17.1053 15.1316 17.1053ZM15.1316 19.7368C9.6816 19.7368 5.26318 15.3184 5.26318 9.86842C5.26318 4.41842 9.6816 0 15.1316 0C20.5816 0 25 4.41842 25 9.86842C25 15.3184 20.5816 19.7368 15.1316 19.7368Z"
        fill={type === LogoTypes.COLOR ? colors.greenBrand : mainColor}
      />
      <Path
        d="M15.4577 19.7369C16.1419 18.9077 16.6324 17.9361 16.8932 16.8932C17.9361 16.6324 18.9077 16.1421 19.7369 15.4579C19.699 16.6658 19.439 17.8563 18.9695 18.9698C17.8561 19.439 16.6656 19.6992 15.4577 19.7369ZM8.10687 8.10687C7.06397 8.36766 6.09239 8.85792 5.26318 9.54213C5.30108 8.33424 5.56108 7.14371 6.03055 6.03029C7.14397 5.56108 8.3345 5.30082 9.54239 5.26318C8.85818 6.09239 8.36766 7.06397 8.10687 8.10687Z"
        fill={type === LogoTypes.COLOR ? '#5EA33B' : mainColor}
      />
    </Svg>
  )
}
