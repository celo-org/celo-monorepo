import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  color?: string
  height?: number
}

const HEIGHT = 111.8
const WIDTH = 276.4
const ASPECT_RATIO = WIDTH / HEIGHT

export default class WordLogo extends React.Component<Props> {
  static defaultProps = {
    color: '#333638',
    height: 50,
  }

  render() {
    return (
      <Svg
        height={this.props.height.toString()}
        width={Math.floor(this.props.height * ASPECT_RATIO).toString()}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        <Path d="M1792.7 1798.5H2521.7V2419.5H1792.7zM2812.7 1594.5H3700.7V2774.5H2812.7z" />
        <Path
          d="M241.2,52c13.1,0,23.7,10.6,23.7,23.7s-10.6,23.7-23.7,23.7c-13.1,0-23.7-10.6-23.7-23.7	C217.4,62.6,228.1,52,241.2,52 M241.2,40.5c-19.4,0-35.2,15.7-35.2,35.2s15.7,35.2,35.2,35.2c19.4,0,35.2-15.7,35.2-35.2	S260.6,40.5,241.2,40.5L241.2,40.5z M170.1,8.5v103.3l12.4-8.5V0L170.1,8.5z M35.1,99.1c-13,0-23.6-10.6-23.6-23.6	s10.6-23.6,23.6-23.6c9.6,0,15,4.7,18.7,10.8l4.8-13.2c-6.2-5.6-14.4-9-23.5-9C15.7,40.5,0,56.2,0,75.6s15.7,35.1,35.1,35.1	c8.8,0,16.9-3.3,23.1-8.6V84.6C53.7,95.5,45.6,99.1,35.1,99.1z M115.8,99.5c-7.1,0-13.1-2.4-17.3-6.9c-3.7-3.9-5.9-9.3-6.3-15.3H133	l0,0h11.5c0-19.4-8.3-36.6-31.9-36.6c-18.5,0-31.9,14.9-31.9,34.7c0,19.4,13.5,35.7,35.1,35.7c11.1,0,19.5-5.3,22.8-8.5V85.4	C135.7,90.9,131.9,99.5,115.8,99.5z M98.1,58.2c3.7-4.1,8.7-6.2,14.4-6.2c7.3,0,12.4,2.1,15.6,6.5c1.5,2,2.6,4.4,3.4,7.3H93.6	C94.7,62.9,96.2,60.4,98.1,58.2z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
