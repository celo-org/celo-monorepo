import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { NavigationScreenProps } from 'react-navigation'
import componentWithAnalytics from 'src/analytics/wrapper'
import BackButton from 'src/components/BackButton'
import i18n, { Namespaces } from 'src/i18n'

const licenseURI = Platform.select({
  ios: './LicenseDisclaimer.txt', // For when iOS is implemented!
  android: 'file:///android_asset/custom/LicenseDisclaimer.txt',
})

type Props = {} & WithNamespaces

class Licenses extends React.Component<Props> {
  static navigationOptions = ({ navigation }: NavigationScreenProps) => ({
    headerStyle: {
      elevation: 0,
    },
    headerTitle: i18n.t('accountScreen10:licenses'),
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
    headerRight: <View />, // This helps vertically center the title
    headerLeft: <BackButton />,
  })

  render() {
    return (
      <WebView
        style={styles.licensesWebView}
        source={{ uri: licenseURI }}
        startInLoadingState={true}
        originWhitelist={['file://']}
      />
    )
  }
}

const styles = StyleSheet.create({
  licensesWebView: {
    marginHorizontal: 20,
  },
})

export default componentWithAnalytics(withNamespaces(Namespaces.accountScreen10)(Licenses))
