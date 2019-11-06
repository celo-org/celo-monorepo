import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
}

export default class Backspace extends React.PureComponent<Props> {
  static defaultProps = {
    height: 30,
    width: 60,
    color: colors.dark,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 35 18"
        fill="none"
      >
        <Path
          d="M1.82198 9.7422L9.57436 16.7422C9.75813 16.9081 9.99693 17 10.2445 17H33C33.5523 17 34 16.5523 34 16V2C34 1.44772 33.5523 1 33 1H10.2445C9.99693 1 9.75813 1.09186 9.57436 1.25779L1.82198 8.25779C1.38221 8.65488 1.38221 9.34512 1.82198 9.7422Z"
          stroke={this.props.color}
          strokeWidth="3"
        />
        <Path d="M17 5L25 13M17 13L25 5" stroke={this.props.color} strokeWidth="3" />
      </Svg>
    )
  }
}
