import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  size?: number
  isGrey?: boolean
}

export default class InfoIcon extends React.PureComponent<Props> {
  static defaultProps = {
    size: 12,
    isGrey: false,
  }

  render() {
    return (
      <Image
        source={
          this.props.isGrey ? require('src/images/info-grey.png') : require('src/images/info.png')
        }
        style={{ width: this.props.size, height: this.props.size }}
      />
    )
  }
}
