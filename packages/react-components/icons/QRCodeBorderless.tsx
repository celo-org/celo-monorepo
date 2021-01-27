import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path, Rect } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class QRCodeBorderless extends React.PureComponent<Props> {
  static defaultProps = {
    height: 32,
    color: colors.greenBrand,
  }

  render() {
    const { color, height } = this.props
    return (
      <Svg width={height} height={height} viewBox="0 0 32 32" fill="none">
        <Rect x={4} y={4} width={10} height={10} rx={3} stroke={color} strokeWidth={2.75} />
        <Rect x={18} y={4} width={10} height={10} rx={3} stroke={color} strokeWidth={2.75} />
        <Path
          d="M18 25v1a2 2 0 002 2h1M28 21v-1a2 2 0 00-2-2h-1M21 18h-1a2 2 0 00-2 2v1M25 28h1a2 2 0 002-2v-1"
          stroke={color}
          strokeWidth={2.75}
          strokeLinecap="round"
        />
        <Rect x={4} y={18} width={10} height={10} rx={3} stroke={color} strokeWidth={2.75} />
      </Svg>
    )
  }
}
