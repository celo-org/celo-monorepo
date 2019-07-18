import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  size?: number
}

export default class InviteSendReceive extends React.PureComponent<Props> {
  static defaultProps = {
    size: 30,
  }

  render() {
    return (
      <Image
        resizeMode="contain"
        source={require('src/images/invite-send-receive.png')}
        style={{ width: this.props.size, height: this.props.size }}
      />
    )
  }
}
