import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  color?: string
  width?: number
  style?: ViewStyle
}

export default class Error extends React.PureComponent<Props> {
  static defaultProps = {
    color: colors.light,
    width: 16,
    style: {},
  }

  render() {
    return (
      <View style={this.props.style} testID={'ErrorIcon'}>
        <Svg
          width={this.props.width}
          height={this.props.width}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.1569 4.75L11.2175 5.81066L8.97834 8.04984L11.3354 10.4069L10.2747 11.4675L7.91768 9.1105L5.56066 11.4675L4.5 10.4069L6.85702 8.04984L4.61785 5.81067L5.67851 4.75001L7.91768 6.98918L10.1569 4.75Z"
            fill={this.props.color}
          />
          <Circle cx="8" cy="8" r="6.5" stroke="white" />
        </Svg>
      </View>
    )
  }
}
