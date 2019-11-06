import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import componentWithAnalytics from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'

class VerificationInputScreen extends React.Component<WithNamespaces> {
  static navigationOptions = null

  render() {
    // const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DevSkipButton nextScreen={Screens.WalletHome} />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default componentWithAnalytics(
  withNamespaces(Namespaces.nuxVerification2)(VerificationInputScreen)
)
