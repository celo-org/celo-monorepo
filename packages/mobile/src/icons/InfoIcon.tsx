import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  size?: number
}

export default class InfoIcon extends React.PureComponent<Props> {
  static defaultProps = {
    size: 12,
  }

  render() {
    return (
      <Image
        source={require('src/images/info.png')}
        style={{ width: this.props.size, height: this.props.size }}
      />
    )
  }
}
