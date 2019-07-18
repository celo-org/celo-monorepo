import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  size?: number
}

export default class CeloAccountIcon extends React.PureComponent<Props> {
  static defaultProps = {
    size: 40,
  }

  render() {
    return (
      <Image
        resizeMode="contain"
        source={require('src/images/celo-account.png')}
        style={{ width: this.props.size, height: this.props.size }}
      />
    )
  }
}
