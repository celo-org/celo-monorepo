import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { TokenTransactionType } from 'src/apollo/types'
import { openUrl } from 'src/app/actions'
import networkConfig from 'src/geth/networkConfig'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { RecipientKind, RecipientWithAddress } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

function useInitialJavaScript(jsonBalances: string, e164PhoneNumber: string | null) {
  const [initialJavaScript, setInitialJavaScript] = useState<string | null>()
  useEffect(() => {
    if (initialJavaScript || !e164PhoneNumber) {
      return
    }

    setInitialJavaScript(`
      window.valora = {
        phoneNumber: "${e164PhoneNumber}",
        balances: ${jsonBalances},
        onPaymentRequest: function (paymentRequest) {
          var payload = { method: 'onPaymentRequest', data: paymentRequest };
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        },
        openUrl: function (url) {
          var payload = { method: 'openUrl', data: { url } };
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };
      true; // note: this is required, or you'll sometimes get silent failures
    `)
  }, [jsonBalances, e164PhoneNumber, initialJavaScript])

  return initialJavaScript
}

type RouteProps = StackScreenProps<StackParamList, Screens.BidaliScreen>
type Props = RouteProps

function BidaliScreen(props: Props) {
  const onMessage = (event: WebViewMessageEvent) => {
    const { method, data } = JSON.parse(event.nativeEvent.data)
    switch (method) {
      case 'onPaymentRequest':
        const { amount, address, currency, description, chargeId } = data
        console.log(`Send ${amount} ${currency} to ${address} for ${description} (${chargeId})`)
        // Show a native send confirmation modal here
        break
      case 'openUrl':
        const { url } = data
        dispatch(openUrl(url))
        break
    }
  }

  const webViewRef = useRef<WebView>(null)
  const cusdBalance = useSelector(stableTokenBalanceSelector)
  const celoBalance = useSelector(celoTokenBalanceSelector)
  const jsonBalances = useMemo(
    () =>
      JSON.stringify({
        cUSD: cusdBalance,
        CELO: celoBalance,
      }),
    [cusdBalance, celoBalance]
  )
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const initialJavaScript = useInitialJavaScript(jsonBalances, e164PhoneNumber)
  const dispatch = useDispatch()

  // Update balances when they change
  useEffect(() => {
    webViewRef.current?.injectJavaScript(`
      window.valora.balances = ${jsonBalances}
    `)
  }, [jsonBalances])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {initialJavaScript ? (
        <WebView
          ref={webViewRef}
          source={{ uri: networkConfig.bidaliUrl }}
          onMessage={onMessage}
          injectedJavaScriptBeforeContentLoaded={initialJavaScript}
        />
      ) : (
        <ActivityIndicator size="large" color={colors.greenBrand} />
      )}
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
    justifyContent: 'center',
  },
})

export default BidaliScreen
