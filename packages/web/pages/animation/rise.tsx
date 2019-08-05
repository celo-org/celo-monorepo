import * as React from 'react'
import OpenGraph from 'src/header/OpenGraph'
import previewImage from 'src/join/preview.png'
import Rise from 'src/join/Rise'
import LogoCombinedColor from 'src/logos/LogoLightBg'

export default class RiseDemo extends React.PureComponent {
  static getInitialProps = () => {
    return { namespacesRequired: [] }
  }
  render() {
    return (
      <>
        <OpenGraph
          path="/animation/rise"
          title={'Celo Rise Animation Demo'}
          description={''}
          image={previewImage}
        />
        <View style={styles.container}>
          <Rise />
          <View style={styles.logoPlace}>
            <a href={'/'}>
              <LogoCombinedColor height={40} />
            </a>
          </View>
        </View>
      </>
    )
  }
}
import { StyleSheet, View } from 'react-native'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100vw',
    maxHeight: '100vh',
    overflow: 'hidden',
  },
  logoPlace: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'white',
  },
})
