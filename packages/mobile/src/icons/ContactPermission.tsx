import * as React from 'react'
import { Image } from 'react-native'
import { contactPermission } from 'src/images/Images'

interface Props {
  height?: number
  width?: number
}

export default class ContactPermission extends React.PureComponent<Props> {
  static defaultProps = {
    height: 50,
    width: 50,
  }

  render() {
    return (
      <Image
        source={contactPermission}
        style={{ height: this.props.height, width: this.props.width }}
      />
    )
  }
}
