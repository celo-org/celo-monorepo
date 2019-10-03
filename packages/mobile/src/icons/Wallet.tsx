import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Rect } from 'svgs'

interface Props {
  height?: number
  color?: string
  width?: number
}
export default class Wallet extends React.Component<Props> {
  static defaultProps = {
    width: 27,
    height: 18,
    color: colors.dark,
  }

  render() {
    return (
      <Svg
        height={this.props.height}
        width={this.props.width}
        viewBox="0 0 31 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Rect
          x="1"
          y="1"
          width="27"
          height="20"
          rx="3"
          fill="#fff"
          stroke={this.props.color}
          strokeWidth="2"
        />
        <Rect
          x="20"
          y="8.5"
          width="10"
          height="5"
          rx="2"
          fill="#fff"
          stroke={this.props.color}
          strokeWidth="2"
        />
      </Svg>
    )
  }
}
