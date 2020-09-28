import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
}

export default class Checkmark extends React.PureComponent<Props> {
  static defaultProps = {
    height: 32,
    width: 32,
    color: colors.greenBrand,
  }

  render() {
    return (
      <Svg width={this.props.width} height={this.props.height} viewBox="0 0 32 32" fill="none">
        <Path
          d="M8.414 15.086a2 2 0 10-2.828 2.828l2.828-2.828zM12.5 22l-1.414 1.414a2 2 0 002.8.029L12.5 22zm13.885-10.557a2 2 0 00-2.77-2.886l2.77 2.886zm-20.8 6.471l5.5 5.5 2.83-2.828-5.5-5.5-2.83 2.828zm8.3 5.529l12.5-12-2.77-2.886-12.5 12 2.77 2.886z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
