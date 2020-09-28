import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers.v2'

type Props = {} & WithTranslation

const LICENSE_SOURCE = Platform.select({
  // `require` only works on iOS with WebView, it breaks on Android when using a release bundle
  // See https://github.com/react-native-community/react-native-webview/issues/428
  ios: require('./LicenseDisclaimer.txt'),
  // Hence on Android we directly reference the asset (copied during postinstall)
  android: { uri: 'file:///android_asset/custom/LicenseDisclaimer.txt' },
})

class Licenses extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:licenses'),
  })

  render() {
    return (
      <View style={styles.container}>
        <WebView style={styles.licensesWebView} source={LICENSE_SOURCE} originWhitelist={['*']} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
  },
  licensesWebView: {
    opacity: 0.99,
    marginHorizontal: 20,
  },
})

export default withTranslation<Props>(Namespaces.accountScreen10)(Licenses)
