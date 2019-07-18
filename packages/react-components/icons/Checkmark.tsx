import * as React from 'react'
import Svg, { Rect } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
}

export default class Checkmark extends React.PureComponent<Props> {
  static defaultProps = {
    height: 47,
    color: '#45CD86',
  }

  render() {
    return (
      <Svg
        height={this.props.height}
        width={this.props.width}
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Rect
          x="6.89185"
          y="17.0205"
          width="8.33324"
          height="2"
          rx="1"
          transform="rotate(-135 6.89185 17.0205)"
          fill={this.props.color}
        />
        <Rect
          x="5.47778"
          y="15.6064"
          width="14.9998"
          height="2"
          rx="1"
          transform="rotate(-45 5.47778 15.6064)"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
