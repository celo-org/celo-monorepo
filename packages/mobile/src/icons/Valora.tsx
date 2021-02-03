import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: string
}

export default class Valora extends React.PureComponent<Props> {
  static defaultProps = {
    size: 17,
    color: colors.greenBrand,
  }

  render() {
    return (
      <Svg
        width="17"
        height="14"
        viewBox="0 0 17 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          d="M10.4936 13.7327C11.1636 8.50665 13.6203 5.53224 17.3333 2.83582L15.4349 0.333984C13.0061 2.19646 10.354 4.83729 9.1256 8.47885C8.12058 5.50444 6.02677 2.89142 2.64876 0.333984L0.666626 2.89142C4.88216 5.89362 7.00388 9.2572 7.59015 13.7327H10.4936Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
