import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { G, Path } from 'svgs'

interface Props {
  color: colors
  size: number
}

export default class HollowCoin extends React.PureComponent<Props> {
  static defaultProps = { color: colors.primary }
  render() {
    const { size, color } = this.props
    return (
      <Svg width={size * 0.88} height={size} viewBox="0 0 88 100" fill="none">
        <G style={{ mixBlendMode: 'normal' }}>
          <Path
            d="M5.05541 46.8176L5.05519 46.8182C-0.0716798 61.7215 0.691052 76.1547 7.38233 86.3371C12.0282 93.4733 19.3353 97.8371 27.9214 98.6172C28.7591 98.6999 29.6324 98.7404 30.683 98.7404C40.457 98.7404 51.0909 94.0999 60.6551 85.8269C70.2531 77.5534 78.1624 66.1433 82.9433 53.6829L82.9438 53.6814C88.7689 38.424 88.1489 23.7157 80.9633 13.4331C75.6706 5.85078 67.3704 1.68823 57.6557 1.68823C46.9978 1.68823 36.0457 6.59958 26.6862 14.6547C17.3193 22.7162 9.48183 33.979 5.05541 46.8176Z"
            stroke={color}
            strokeWidth="2"
          />
        </G>
      </Svg>
    )
  }
}
