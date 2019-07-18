import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Logo from 'src/icons/Logo'

interface Props {
  style?: any
  testID?: string
  height?: number
}

export default class NuxLogo extends React.PureComponent<Props> {
  static defaultProps = {
    style: {},
    height: 50,
  }

  render() {
    return (
      <View style={[styles.logo, this.props.style]} testID={this.props.testID}>
        <Logo height={this.props.height} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 25,
  },
})
