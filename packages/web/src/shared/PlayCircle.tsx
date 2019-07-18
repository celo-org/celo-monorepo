import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Ellipse, Path } from 'svgs'

export default class PlayCircle extends React.PureComponent {
  render() {
    return (
      <Svg width="68" height="68" viewBox="0 0 68 68" fill="none">
        <Ellipse cx="33.9123" cy="34.0865" rx="33.4196" ry="33.4947" fill={colors.primary} />
        <Path
          d="M46.8013 33.4895C47.4921 33.8694 47.4921 34.862 46.8013 35.2419L27.0396 46.1111C26.3731 46.4777 25.5576 45.9955 25.5576 45.2349L25.5576 23.4965C25.5576 22.7359 26.3731 22.2537 27.0396 22.6203L46.8013 33.4895Z"
          fill="white"
        />
      </Svg>
    )
  }
}
