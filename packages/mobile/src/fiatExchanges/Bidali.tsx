import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'

const runFirst = `
  window.valora = {
    balances: {
      "CUSD": 20
    },
    onPaymentRequest: function (paymentRequest) {
      var payload = { method: 'onPaymentRequest', data: paymentRequest };
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  };
  true; // note: this is required, or you'll sometimes get silent failures
`

type RouteProps = StackScreenProps<StackParamList, Screens.Bidali>
type Props = RouteProps

function Bidali(props: Props) {
  const onMessage = (event: WebViewMessageEvent) => {
    const { method, data } = JSON.parse(event.nativeEvent.data)
    if (method === 'onPaymentRequest') {
      console.log(method, data)
      const { amount, address, currency, description, chargeId } = data
      // TODO: Show a native send confirmation modal
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <WebView
        source={{ uri: networkConfig.bidaliUrl }}
        onMessage={onMessage}
        injectedJavaScriptBeforeContentLoaded={runFirst}
      />
    </SafeAreaView>
  )
}

Bidali.navigationOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default Bidali
