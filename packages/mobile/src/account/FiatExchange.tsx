import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import componentWithAnalytics from 'src/analytics/wrapper'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'

const moonpayUri = 'https://buy-staging.moonpay.io/?apiKey=pk_test_EDT0SRJUlsJezJUFGaVZIr8LuaTsF5NO'

type Props = {} & WithTranslation

class FiatExchange extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:licenses'),
  })

  render() {
    return <WebView style={styles.licensesWebView} source={{ uri: moonpayUri }} />
  }
}

const styles = StyleSheet.create({
  licensesWebView: {
    marginHorizontal: 20,
  },
})

export default componentWithAnalytics(withTranslation(Namespaces.accountScreen10)(FiatExchange))
