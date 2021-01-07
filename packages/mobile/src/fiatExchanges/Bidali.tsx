import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { TokenTransactionType } from 'src/apollo/types'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { RecipientKind, RecipientWithAddress } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'

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

function BidaliScreen(props: Props) {
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

BidaliScreen.navigationOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
    // Temporary until we can test this e2e
    headerRight: () => {
      const onPress = () => {
        const recipient: RecipientWithAddress = {
          kind: RecipientKind.Address,
          address: '0xa6d1e0bdb6960c3f1bda8ef8f1e91480cfc40dbb',
          displayId: 'MyTestID',
          displayName: 'Bidali',
          // displayName: data.displayName || cachedRecipient?.displayName || 'anonymous',
          // e164PhoneNumber: data.e164PhoneNumber,
          // phoneNumberLabel: cachedRecipient?.phoneNumberLabel,
          // thumbnailPath: cachedRecipient?.thumbnailPath,
          // contactId: cachedRecipient?.contactId,
        }
        const transactionData: TransactionDataInput = {
          recipient,
          amount: new BigNumber(20),
          reason: 'Bidali',
          type: TokenTransactionType.PayPrefill,
        }
        navigate(Screens.SendConfirmation, {
          transactionData,
          isFromScan: true,
          // currencyInfo: { localCurrencyCode: currency, localExchangeRate: exchangeRate },
        })
      }
      return <TopBarTextButton title="Simulate Pay" onPress={onPress} />
    },
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default BidaliScreen
