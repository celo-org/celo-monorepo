import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Line, Path, Rect } from 'svgs'

interface Props {
  color?: string
}

export default class Download extends React.PureComponent<Props> {
  static defaultProps = {
    color: colors.light,
  }

  render() {
    const { color } = this.props
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={10}
        height={12}
        viewBox="0 0 10 12"
        fill="none"
      >
        <Line y1="11.5" x2="10" y2="11.5" stroke={color} />
        <Path d="M5 10L1.5359 5.5L8.4641 5.5L5 10Z" fill={color} />
        <Rect x="4" width="2" height="7" fill={color} />
      </Svg>
    )
  }
}
