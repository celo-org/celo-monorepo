import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FullCircle from 'src/community/connect/FullCircle'
import OpenGraph from 'src/header/OpenGraph'
import LogoCombinedColor from 'src/logos/LogoDarkBg'
import { colors } from 'src/styles'
const preview = require('src/community/connect/preview.jpg')
export default class CommunityDemo extends React.PureComponent {
  static getInitialProps = () => {
    return { namespacesRequired: [] }
  }
  render() {
    return (
      <>
        <OpenGraph
          path="/animation/community"
          title={'Celo Community Animation Demo'}
          description={'Rising Coins'}
          image={preview}
        />
        <View style={styles.fullScreen}>
          <FullCircle lightBackground={false} />
          <View style={styles.logo}>
            <a href={'/'}>
              <LogoCombinedColor height={40} />
            </a>
          </View>
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  fullScreen: {
    width: '100vw',
    height: '100vh',
    minWidth: '100%',
    backgroundColor: colors.dark,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: '5vh',
    paddingHorizontal: '2vw',
    paddingBottom: '0',
  },
  logo: {
    marginVertical: '5vh',
  },
})
