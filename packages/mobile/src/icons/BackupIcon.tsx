import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  height?: number
  width?: number
  style?: any
}

export default class VerifyAddressBook extends React.PureComponent<Props> {
  static defaultProps = {
    height: 70,
    width: 80,
  }

  render() {
    return (
      <Image
        source={require('src/images/backup-icon.png')}
        style={[{ height: this.props.height, width: this.props.width }, this.props.style]}
      />
    )
  }
}
