import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  color?: string
  size?: number
}

export default class RoundedArrow extends React.PureComponent<Props> {
  static defaultProps = {
    color: colors.gray4,
    size: 20,
  }

  render() {
    return (
      <Svg
        width={this.props.size}
        height={this.props.size}
        viewBox="0 0 16 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          fill={this.props.color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15.7083 7.57011L15.7064 7.57199L9.83868 13.4397C9.44968 13.8287 8.81899 13.8287 8.42999 13.4397C8.04099 13.0507 8.04099 12.42 8.42999 12.031L12.5952 7.8658L1.85618 7.8658C1.3039 7.8658 0.856182 7.41808 0.856182 6.8658C0.856182 6.31351 1.3039 5.8658 1.85618 5.8658L12.5953 5.8658L8.43008 1.7006C8.04108 1.3116 8.04108 0.680914 8.43008 0.291917C8.81907 -0.0970799 9.44976 -0.0970798 9.83876 0.291917L15.7083 6.16143C16.0973 6.55043 16.0973 7.18112 15.7083 7.57011Z"
        />
      </Svg>
    )
  }
}
