import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class CheckCircle extends React.PureComponent<Props> {
  static defaultProps = {
    width: 24,
    height: 24,
    color: colors.greenUI,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 24 24"
      >
        <Circle cx="12" cy="12" r="12" fill={this.props.color} />
        <Path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M9.74449 16.6294C9.74581 16.6307 9.74713 16.6321 9.74846 16.6334C10.0609 16.9458 10.5674 16.9458 10.8798 16.6334L18.2336 9.2796C18.5461 8.96718 18.5461 8.46065 18.2336 8.14823C17.9212 7.83581 17.4147 7.83581 17.1023 8.14823L10.3142 14.9363L7.29707 11.9192C6.98465 11.6068 6.47812 11.6068 6.1657 11.9192C5.85328 12.2317 5.85328 12.7382 6.1657 13.0506L9.74449 16.6294Z"
          fill="white"
        />
      </Svg>
    )
  }
}
