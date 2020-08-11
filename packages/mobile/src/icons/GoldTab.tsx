import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class GoldTab extends React.Component<Props> {
  static defaultProps = {
    width: 22.5,
    height: 22.5,
    color: colors.gray5,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 25 25"
        fill="none"
      >
        <Circle cx="8.5" cy="16.5" r="7.5" stroke={this.props.color} strokeWidth="2" />
        <Path
          d="M16 16.5h-1v1h1zM8.5 9h-1v1h1zm14 0a6.5 6.5 0 0 1-6.5 6.5v2A8.5 8.5 0 0 0 24.5 9zM16 2.5A6.5 6.5 0 0 1 22.5 9h2A8.5 8.5 0 0 0 16 .5zM9.5 9A6.5 6.5 0 0 1 16 2.5v-2A8.5 8.5 0 0 0 7.5 9zm-1 1a6.5 6.5 0 0 1 6.5 6.5h2A8.5 8.5 0 0 0 8.5 8z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
