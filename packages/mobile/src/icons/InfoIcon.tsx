import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { Image } from 'react-native'

interface Props {
  size?: number
  tintColor?: string
}

export default class InfoIcon extends React.PureComponent<Props> {
  static defaultProps = {
    size: 12,
    tintColor: colors.greenBrand,
  }

  render() {
    return (
      <Image
        source={require('src/images/info.png')}
        style={{ width: this.props.size, height: this.props.size, tintColor: this.props.tintColor }}
      />
    )
  }
}
