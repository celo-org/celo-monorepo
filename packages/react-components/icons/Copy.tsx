import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  width?: number
  height?: number
  color?: string
}

export default class Copy extends React.PureComponent<Props> {
  static defaultProps = {
    width: 20,
    height: 25,
    color: colors.light,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.width}
        viewBox="0 0 20 25"
      >
        <Path
          d="M17 5H5.5V22H17V5Z"
          fill="rgba(0,0,0,0)"
          stroke={this.props.color}
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <Path
          d="M13 1H1.5V18"
          fill="rgba(0,0,0,0)"
          stroke={this.props.color}
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </Svg>
    )
  }
}
