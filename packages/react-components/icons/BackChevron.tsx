import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class BackChevron extends React.PureComponent<Props> {
  static defaultProps = {
    height: 50,
    color: colors.greenBrand,
  }

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 15 15"
      >
        <Path
          d="M0.442803 7.08502C0.444561 7.33572 0.533359 7.58609 0.710547 7.78183C0.744524 7.81936 0.780571 7.85359 0.818325 7.88449L6.40331 13.4695C6.79383 13.86 7.41088 13.8447 7.78152 13.4352C8.15216 13.0258 8.13604 12.3773 7.74551 11.9867L2.83181 7.07304L7.74561 2.15923C8.13614 1.76871 8.15225 1.12021 7.78161 0.710762C7.41097 0.301318 6.79393 0.285981 6.4034 0.676505L0.819307 6.2606C0.78116 6.29173 0.744749 6.32625 0.710448 6.36414C0.527591 6.56614 0.438871 6.82633 0.442803 7.08502Z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
