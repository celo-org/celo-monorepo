import * as React from 'react'
import { CeloLinks } from 'src/shared/menu-items'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color: colors
}

export default class TwitterLogo extends React.PureComponent<Props> {
  static defaultProps = {
    height: 40,
    color: colors.primary,
  }

  render() {
    const { height, color } = this.props

    return (
      <a
        href={CeloLinks.twitter}
        target="_blank"
        rel="noopener"
        style={{ lineHeight: `${height}px`, height: `${height}px` }}
      >
        <TweetLogo color={color} height={height} />
      </a>
    )
  }
}

export function TweetLogo({ height, color }) {
  return (
    <Svg width={height} height={height} viewBox="0 0 28 24" fill="none">
      <title>Twitter</title>
      <Path
        fill={color}
        d="M8.80544 24C19.3715 24 25.1507 14.7676 25.1507 6.7613C25.1507 6.49907 25.1451 6.23802 25.1339 5.97815C26.255 5.12295 27.2306 4.0563 28 2.84083C26.9707 3.32277 25.863 3.6476 24.7005 3.79407C25.8866 3.044 26.7971 1.85688 27.2261 0.442957C26.1162 1.13751 24.8864 1.64189 23.5782 1.91357C22.531 0.737081 21.0381 0 19.3861 0C16.2131 0 13.6405 2.71326 13.6405 6.05847C13.6405 6.5345 13.6909 6.99636 13.7894 7.43932C9.016 7.18653 4.78128 4.77567 1.9488 1.10916C1.45488 2.00453 1.1704 3.04518 1.1704 4.15435C1.1704 6.25692 2.18512 8.11143 3.72624 9.19697C2.78432 9.16626 1.8984 8.8934 1.12448 8.43863C1.12336 8.46343 1.12336 8.48942 1.12336 8.5154C1.12336 11.4496 3.10352 13.8994 5.73216 14.4546C5.24944 14.5928 4.74208 14.6672 4.21792 14.6672C3.84832 14.6672 3.48768 14.6282 3.13824 14.5573C3.8696 16.9647 5.98976 18.7164 8.50528 18.7648C6.53856 20.3902 4.06224 21.3588 1.37088 21.3588C0.9072 21.3588 0.45024 21.3304 0 21.2749C2.5424 22.9971 5.5608 24 8.80544 24Z"
      />
    </Svg>
  )
}
