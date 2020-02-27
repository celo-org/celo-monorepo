import * as React from 'react'
import { colors } from 'src/styles'
import { Path, Svg } from 'svgs'

export enum ColorScheme {
  'allWhite',
  'allBlack',
  'darkBG',
  'lightBG',
}

interface Props {
  height?: number
  colorScheme: ColorScheme
}

export default React.memo(function Logo(props: Props) {
  return (
    <Svg width={(props.height / 25) * 85} height={props.height} viewBox="0 0 85 25" fill="none">
      <Path
        d="M64.2368 22.079L66.5 21.3684V2.63159L64.2368 3.34212V22.079ZM38.1316 10.7105C39.5526 10.7105 40.8684 11.3421 41.7105 12.3947L42.6316 10.2632C41.421 9.10528 39.8158 8.55264 38.1316 8.55264C34.2368 8.55264 31.5526 11.6316 31.5789 15.0263C31.6052 18.7105 34.5 21.7105 38.1316 21.7105C39.9737 21.7105 41.3684 21.1579 42.421 20.3947V17.7895C41.3158 18.8947 39.7105 19.5526 38.3158 19.5526C36.2105 19.5526 33.8421 17.8421 33.8421 15.0263C33.8421 12.4211 35.8947 10.7105 38.1316 10.7105ZM53.1842 8.55264C49.2895 8.55264 47.0263 11.6316 47.0263 15.0263C47.0263 18.7105 49.9473 21.7105 53.5789 21.7105C55.421 21.7105 56.8158 21.1579 57.8684 20.3947V17.7895C56.7631 18.8947 55.1579 19.5526 53.7631 19.5526C51.8947 19.5526 49.8421 18.3947 49.421 15.9474H59.3421V15.079C59.3421 11.4474 56.9473 8.55264 53.1842 8.55264ZM77.6316 8.55264C74 8.55264 71.0526 11.5 71.0526 15.1316C71.0526 18.7632 74 21.7105 77.6316 21.7105C81.2631 21.7105 84.2105 18.7632 84.2105 15.1316C84.2105 11.5 81.2631 8.55264 77.6316 8.55264ZM53.2105 10.7105C54.9737 10.7105 56.8421 11.8158 57 13.9474H49.421C49.5789 11.8158 51.4473 10.7105 53.2105 10.7105ZM77.6316 19.5526C75.1842 19.5526 73.2105 17.579 73.2105 15.1316C73.2105 12.6842 75.1842 10.7105 77.6316 10.7105C80.0789 10.7105 82.0526 12.6842 82.0526 15.1316C82.0526 17.579 80.0789 19.5526 77.6316 19.5526Z"
        fill={getColor(props.colorScheme, colors.white, '#2E3338')}
      />
      <Path
        d="M15.1316 17.1053C19.1284 17.1053 22.3684 13.8653 22.3684 9.86842C22.3684 5.87158 19.1284 2.63158 15.1316 2.63158C11.1348 2.63158 7.89476 5.87158 7.89476 9.86842C7.89476 13.8653 11.1348 17.1053 15.1316 17.1053ZM15.1316 19.7368C9.6816 19.7368 5.26318 15.3184 5.26318 9.86842C5.26318 4.41842 9.6816 0 15.1316 0C20.5816 0 25 4.41842 25 9.86842C25 15.3184 20.5816 19.7368 15.1316 19.7368Z"
        fill={getColor(props.colorScheme, '#35D07F', '#35D07F')}
      />
      <Path
        d="M9.86842 22.3684C13.8653 22.3684 17.1053 19.1284 17.1053 15.1316C17.1053 11.1348 13.8653 7.89476 9.86842 7.89476C5.87158 7.89476 2.63158 11.1348 2.63158 15.1316C2.63158 19.1284 5.87158 22.3684 9.86842 22.3684ZM9.86842 25C4.41842 25 0 20.5816 0 15.1316C0 9.6816 4.41842 5.26318 9.86842 5.26318C15.3184 5.26318 19.7368 9.6816 19.7368 15.1316C19.7368 20.5816 15.3184 25 9.86842 25Z"
        fill={getColor(props.colorScheme, '#FBCC5C', '#FBCC5C')}
      />
      <Path
        d="M15.4553 19.7315C16.1392 18.903 16.6292 17.932 16.89 16.8899C17.9321 16.6294 18.9029 16.1391 19.7316 15.4554C19.6937 16.6623 19.4339 17.852 18.9647 18.9646C17.8521 19.4338 16.6624 19.6936 15.4553 19.7315ZM8.11026 8.10989C7.06815 8.37042 6.09736 8.86068 5.26868 9.54436C5.30657 8.33752 5.56631 7.14778 6.03552 6.03515C7.14815 5.56594 8.33789 5.30621 9.54473 5.26831C8.86105 6.09699 8.37078 7.06778 8.11026 8.10989Z"
        fill={getColor(props.colorScheme, '#ECFF8F', '#5EA33B')}
      />
    </Svg>
  )
})

function getColor(scheme: ColorScheme, whenDark: string, whenLight: string) {
  switch (scheme) {
    case ColorScheme.allBlack:
      return colors.black
    case ColorScheme.allWhite:
      return colors.white
    case ColorScheme.lightBG:
      return whenLight
    case ColorScheme.darkBG:
      return whenDark
  }
}
