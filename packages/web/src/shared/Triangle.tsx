import * as React from 'react'
import Svg, { Path } from 'svgs'

export enum Direction {
  down = 0,
  left = 90,
  up = 180,
}

interface Props {
  direction: Direction
}

export default class Triangle extends React.PureComponent<Props> {
  static defaultProps = { direction: Direction.down }
  render() {
    return (
      <Svg
        title="triangle"
        width="14"
        height="14"
        viewBox="0 0 14 8"
        fill="none"
        transform={`rotate(${this.props.direction})`}
      >
        <Path fillRule="evenodd" clipRule="evenodd" d="M7 8L0 0H14L7 8Z" fill="#3D3D3D" />
      </Svg>
    )
  }
}
