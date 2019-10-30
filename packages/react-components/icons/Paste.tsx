import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  width?: number
  height?: number
  color?: string
}

export default class Paste extends React.PureComponent<Props> {
  static defaultProps = {
    width: 20,
    height: 25,
    color: colors.celoGreen,
  }

  render() {
    return (
      <Svg height={this.props.height} width={this.props.width} viewBox="0 0 448 512">
        <Path
          d="M128 184c0-30.879 25.122-56 56-56h136V56c0-13.255-10.745-24-24-24h-80.61C204.306 12.89 183.637 0 160 0s-44.306 12.89-55.39 32H24C10.745 32 0 42.745 0 56v336c0 13.255 10.745 24 24 24h104V184zm32-144c13.255 0 24 10.745 24 24s-10.745 24-24 24-24-10.745-24-24 10.745-24 24-24zm184 248h104v200c0 13.255-10.745 24-24 24H184c-13.255 0-24-10.745-24-24V184c0-13.255 10.745-24 24-24h136v104c0 13.2 10.8 24 24 24zm104-38.059V256h-96v-96h6.059a24 24 0 0 1 16.97 7.029l65.941 65.941a24.002 24.002 0 0 1 7.03 16.971z"
          fill={this.props.color}
          // stroke={this.props.color}
        />
      </Svg>
    )
  }
}
