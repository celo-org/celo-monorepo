import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Platform, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import componentWithAnalytics from 'src/analytics/wrapper'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'

const licenseURI = Platform.select({
  ios: './LicenseDisclaimer.txt', // For when iOS is implemented!
  android: 'file:///android_asset/custom/LicenseDisclaimer.txt',
}) as string

type Props = {} & WithTranslation

class Licenses extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:licenses'),
  })

  render() {
    return (
      <WebView
        style={styles.licensesWebView}
        source={{ uri: licenseURI }}
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

export default componentWithAnalytics(withTranslation(Namespaces.accountScreen10)(Licenses))
