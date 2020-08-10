import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class CeloGold extends React.PureComponent<Props> {
  static defaultProps = {
    height: 50,
    color: colors.goldBrand,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 300 300"
      >
        <Path
          d="M158.9 227.8c-9.2 0-18-1.6-26.3-4.6V77.4c8.2-3 17-4.6 26.3-4.6 25.6 0 44.4 9.8 58.6 30.9l12.7-35.2c-19.8-17.2-45-26.7-71.3-26.7-59.8 0-108.5 48.7-108.5 108.5s48.7 108.5 108.5 108.5c25.9 0 50.9-9.2 70.5-26v-42.2c-13.9 25.3-36.6 37.2-70.5 37.2zm-77.5-77.5c0-24 10.9-45.4 28.1-59.6v119.2c-17.1-14.2-28.1-35.7-28.1-59.6z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
