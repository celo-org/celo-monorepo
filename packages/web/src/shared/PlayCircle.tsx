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

interface Props {
  height: number
  color?: colors
}

export function PlayCircle2(props) {
  return (
    <Svg width={props.height} height={props.height} viewBox="0 0 40 40" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40ZM16.7857 24.9487L26.4286 20L16.7857 15.0513V24.9487Z"
        fill={props.color || colors.white}
      />
    </Svg>
  )
}
