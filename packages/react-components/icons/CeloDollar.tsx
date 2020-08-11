import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

export default class CeloDollar extends React.PureComponent<Props> {
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
        viewBox="0 0 300 300"
      >
        <Path
          d="M81.2 150.6v2c0 .6 0 1.1.1 1.7 2.1 40.9 36 73.5 77.4 73.5 33.9 0 56.6-11.9 70.5-37.2v42.5c-19.6 16.8-44.6 26-70.5 26-10.3 0-20.3-1.4-29.7-4.1l-11.2 31-21.8-7.9 11.5-31.9c-31.1-16.7-53.2-48.2-56.8-85-.1-.8-.2-1.6-.2-2.4-.1-1-.1-1.9-.2-2.9 0-.8-.1-1.6-.1-2.3v-1.5-1.7c0-59.8 48.7-108.5 108.5-108.5 7.4 0 14.6.7 21.7 2.2l10.7-29.7 21.8 7.8L202.5 51c9.9 4.4 19.2 10.2 27.5 17.5l-.1.2.1.1-12.7 35.2c-14.2-21.1-32.9-30.9-58.6-30.9-42.7 0-77.5 34.8-77.5 77.5z"
          fill={this.props.color}
        />
      </Svg>
    )
  }
}
