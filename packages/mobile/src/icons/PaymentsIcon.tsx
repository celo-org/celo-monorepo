import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Line, Rect } from 'svgs'

interface Props {
  height?: number
  color?: string
  width?: number
}

export default class PaymentsIcon extends React.PureComponent<Props> {
  static defaultProps = {
    width: 28,
    height: 28,
    color: colors.dark,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.width}
        viewBox="0 0 34 34"
        fill="none"
      >
        <Rect
          x="1.75"
          y="1.75"
          width="30.5"
          height="30.5"
          rx="5.25"
          stroke={this.props.color}
          strokeWidth="2.5"
        />
        <Line x1="17.25" y1="11" x2="17.25" y2="23" stroke={this.props.color} strokeWidth="2.5" />
        <Line x1="11" y1="16.75" x2="23" y2="16.75" stroke={this.props.color} strokeWidth="2.5" />
      </Svg>
    )
  }
}
