import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { Namespaces } from 'src/i18n'
import DancingRings from 'src/icons/DancingRings'

class VerificationSuccessScreen extends React.Component<WithNamespaces> {
  static navigationOptions = { header: null }

  render() {
    // const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Success!</Text>
        <DancingRings />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...fontStyles.h1,
    zIndex: 100,
  },
})

export default withNamespaces(Namespaces.nuxVerification2)(VerificationSuccessScreen)
