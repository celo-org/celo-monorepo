import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
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
      <View style={styles.container}>
        <WebView
          style={styles.licensesWebView}
          source={{ uri: licenseURI }}
          originWhitelist={['file://']}
        />
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
