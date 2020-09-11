import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color?: string
  width?: number
}

export default class Search extends React.PureComponent<Props> {
  static defaultProps = {
    width: 14,
    height: 14,
    color: colors.gray5,
  }

  render() {
    return (
      <Svg
        width={this.props.width}
        height={this.props.height}
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.65971 7.31402C2.65971 9.88456 4.74354 11.9684 7.31408 11.9684C9.88462 11.9684 11.9685 9.88456 11.9685 7.31402C11.9685 4.74348 9.88462 2.65964 7.31408 2.65964C4.74354 2.65964 2.65971 4.74348 2.65971 7.31402ZM6.10352e-05 7.31402C6.10352e-05 11.3534 3.27466 14.628 7.31408 14.628C8.65119 14.628 9.9045 14.2692 10.983 13.6427L14.9508 17.6105C15.4701 18.1298 16.3121 18.1298 16.8315 17.6105C17.3508 17.0912 17.3508 16.2492 16.8315 15.7298L13.0074 11.9058C14.0211 10.6505 14.6281 9.05315 14.6281 7.31402C14.6281 3.2746 11.3535 0 7.31408 0C3.27466 0 6.10352e-05 3.2746 6.10352e-05 7.31402Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
