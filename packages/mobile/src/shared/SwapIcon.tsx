import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  size?: number
  color?: string
}

export default class SwapIcon extends React.PureComponent<Props> {
  static defaultProps = {
    size: 20,
    color: colors.greenBrand,
  }

  render() {
    return (
      <Svg
        width={this.props.size}
        height={this.props.size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Circle cx="20" cy="20" r="20" transform="rotate(90 20 20)" fill={this.props.color} />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M30 16C30 15.4477 29.5523 15 29 15L17.75 15L17.75 12.8356C17.75 12.0058 16.7976 11.537 16.14 12.0432L12.0294 15.2076C11.5094 15.6079 11.5094 16.3921 12.0294 16.7924L16.14 19.9568C16.7976 20.463 17.75 19.9942 17.75 19.1644L17.75 17L29 17C29.5523 17 30 16.5523 30 16ZM11 24C11 23.4477 11.4477 23 12 23L23.25 23L23.25 20.8356C23.25 20.0058 24.2024 19.537 24.86 20.0432L28.9706 23.2076C29.4906 23.6079 29.4906 24.3921 28.9706 24.7924L24.86 27.9568C24.2024 28.463 23.25 27.9942 23.25 27.1644L23.25 25L12 25C11.4477 25 11 24.5523 11 24Z"
          fill="white"
        />
      </Svg>
    )
  }
}
