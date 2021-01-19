import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class RadioButton extends React.PureComponent<Props> {
  static defaultProps = {
    width: 20,
    height: 20,
    color: colors.greenUI,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 20 20"
      >
        <Circle cx="10" cy="10" r="6" fill={this.props.color} />
        <Circle cx="10" cy="10" r="9" stroke={this.props.color} strokeWidth={2} />
      </Svg>
    )
  }
}
