import * as React from 'react'
import { G, Path } from 'src/shared/svg'
import { colors } from 'src/styles'
import Svg from 'svgs'

interface Props {
  color: colors
  size: number
  style?: unknown
  viewBox?: string
  mixBlendMode?: 'multiply' | 'screen' // note not all blend modes work in all browsers; 'multiply' seem to be best
}

export default class OvalCoin extends React.PureComponent<Props> {
  static defaultProps = { color: colors.primary, mixBlendMode: 'normal', viewBox: '0 0 83 98' }
  render() {
    const { mixBlendMode } = this.props
    return (
      <Svg
        width={this.props.size}
        height={this.props.size}
        viewBox={this.props.viewBox}
        fill="none"
      >
        <G style={{ mixBlendMode }}>
          <Path
            d="M54.5568 0.387939C34.0744 0.387939 12.1108 19.8688 3.46956 45.6981C-1.53621 60.694 -0.736234 75.0526 5.66354 85.0874C10.0911 92.0973 17.0453 96.3807 25.243 97.147C26.0351 97.2277 26.8667 97.268 27.8806 97.268C37.2426 97.268 47.5393 92.6781 56.8776 84.3534C66.2396 76.0367 73.97 64.5498 78.6431 51.9982C84.33 36.6474 83.6568 22.0387 76.7976 11.9232C71.7602 4.48578 63.8634 0.387939 54.5568 0.387939Z"
            fill={this.props.color}
            style={this.props.style}
          />
        </G>
      </Svg>
    )
  }
}
