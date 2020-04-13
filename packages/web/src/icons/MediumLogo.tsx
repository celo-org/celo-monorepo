import * as React from 'react'
import { CeloLinks } from 'src/shared/menu-items'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color: colors
  wrapWithLink?: boolean
}

export default class MediumLogo extends React.PureComponent<Props> {
  static defaultProps = {
    height: 40,
    color: colors.primary,
    wrapWithLink: true,
  }

  render() {
    const { height, color, wrapWithLink } = this.props
    if (wrapWithLink) {
      return (
        <a
          href={CeloLinks.mediumPublication}
          target="_blank"
          rel="noopener"
          style={{ lineHeight: `${height}px`, height: `${height}px` }}
        >
          <MediumIcon color={color} height={height} />
        </a>
      )
    } else {
      return <MediumIcon color={color} height={height} />
    }
  }
}

function MediumIcon({ height, color }) {
  return (
    <Svg width={height} height={height} viewBox="0 0 24 24" fill="none">
      <title>Medium</title>
      <Path
        fill={color}
        d="M0 0V24H24V0H0ZM19.9385 5.68615L18.6511 6.92062C18.5403 7.00554 18.4849 7.14462 18.5083 7.28246V16.3495C18.4849 16.4874 18.5403 16.6265 18.6511 16.7114L19.9089 17.9446V18.2154H13.5852V17.9446L14.8874 16.6806C15.0154 16.5526 15.0154 16.5157 15.0154 16.32V8.99077L11.3957 18.1858H10.9058L6.69046 8.99077V15.1532C6.656 15.4117 6.74215 15.6726 6.92431 15.8609L8.61785 17.9151V18.1858H3.81538V17.9151L5.50892 15.8609C5.68985 15.6726 5.77108 15.4105 5.72677 15.1532V8.02708C5.74769 7.82892 5.67138 7.63323 5.52369 7.50031L4.01846 5.68615V5.41538H8.69292L12.3065 13.3391L15.4818 5.41538H19.9385V5.68615Z"
      />
    </Svg>
  )
}
