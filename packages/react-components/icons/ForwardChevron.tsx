import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  width?: number
  color?: string
}

export default class ForwardChevron extends React.PureComponent<Props> {
  static defaultProps = {
    height: 20,
    width: 10,
    color: colors.gray3,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.width}
        viewBox="0 0 15 16"
      >
        <Path
          d="M8.70376 9.12461L2.12123 15.7071C1.73071 16.0976 1.09755 16.0976 0.707015 15.7071C0.316497 15.3166 0.316497 14.6834 0.707015 14.2929L6.58575 8.41419L0.707091 2.53553C0.316573 2.14501 0.316573 1.51185 0.707091 1.12131C1.09761 0.730797 1.73079 0.730797 2.12131 1.12131L8.70708 7.70708C9.0976 8.09762 9.0976 8.73078 8.70708 9.1213L8.70376 9.12461Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
