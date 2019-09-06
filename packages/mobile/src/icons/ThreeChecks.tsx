import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  height?: number
  width?: number
  style?: any
}

export default class ThreeChecks extends React.PureComponent<Props> {
  static defaultProps = {
    height: 50,
    width: 50,
  }

  render() {
    return (
      <Image
        source={require('src/images/3-checks.png')}
        style={[{ height: this.props.height, width: this.props.width }, this.props.style]}
      />
    )
  }
}
