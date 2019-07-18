import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import Header from 'src/header/Header.3'

class Rewards extends React.Component {
  componentDidMount() {
    window.location.replace('https://storage.googleapis.com/verifier-apk/verifier-production.apk')
  }

  render() {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.maxWidth}>
          <View style={styles.headerBox}>
            <H1 style={styles.header}>Gracias por descargar la aplicación verificadora!</H1>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 80,
  },
  maxWidth: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    maxWidth: 854,
  },
  headerBox: {
    alignSelf: 'stretch',
  },
  header: {
    alignSelf: 'stretch',
    marginTop: 127,
    marginBottom: 21,
  },
})

export default Rewards
