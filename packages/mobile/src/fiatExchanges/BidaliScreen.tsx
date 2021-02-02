import colors from '@celo/react-components/styles/colors'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebViewMessageEvent } from 'react-native-webview'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { openUrl } from 'src/app/actions'
import WebView, { WebViewRef } from 'src/components/WebView'
import { bidaliPaymentRequested } from 'src/fiatExchanges/actions'
import networkConfig from 'src/geth/networkConfig'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

function useInitialJavaScript(
  currency: CURRENCY_ENUM,
  jsonBalances: string,
  e164PhoneNumber: string | null
) {
  const [initialJavaScript, setInitialJavaScript] = useState<string | null>()
  useEffect(() => {
    if (initialJavaScript) {
      return
    }

    // This JavaScript code runs in the WebView
    // Bidali reads the paymentCurrency, phoneNumber and balances to provide a more deeply integrated experience.
    // When a payment request is needed, Bidali calls the provided `onPaymentRequest` method.
    // When a new url needs to be open (currently for FAQ, Terms of Service), `openUrl` is called by Bidali.
    // See also the comment in the `onMessage` handler
    setInitialJavaScript(`
      window.valora = {
        paymentCurrency: "${CURRENCIES[currency].code.toUpperCase()}",
        phoneNumber: ${JSON.stringify(e164PhoneNumber)},
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

function BidaliScreen({ route, navigation }: Props) {
  const onLoadEnd = () => {
    // Remove loading indicator
    navigation.setOptions({
      headerRight: undefined,
    })
  }
  const onMessage = (event: WebViewMessageEvent) => {
    const { method, data } = JSON.parse(event.nativeEvent.data)
    switch (method) {
      case 'onPaymentRequest':
        const { amount, address, currency, description, chargeId } = data
        // These 2 callbacks needs to be called to notify Bidali of the status of the payment request
        // so it can update the WebView accordingly.
        const onPaymentSent = () => {
          webViewRef.current?.injectJavaScript(`window.valora.paymentSent();`)
        }
        const onCancelled = () => {
          webViewRef.current?.injectJavaScript(`window.valora.paymentCancelled();`)
        }
        dispatch(
          bidaliPaymentRequested(
            address,
            amount,
            currency,
            description,
            chargeId,
            onPaymentSent,
            onCancelled
          )
        )
        break
      case 'openUrl':
        const { url } = data
        dispatch(openUrl(url))
        break
    }
  }

  const webViewRef = useRef<WebViewRef>(null)
  const cusdBalance = useSelector(stableTokenBalanceSelector)
  const celoBalance = useSelector(celoTokenBalanceSelector)
  const jsonBalances = useMemo(
    () =>
      JSON.stringify({
        CUSD: cusdBalance,
        // We'll add CELO support later on
        // CELO: celoBalance,
      }),
    [cusdBalance, celoBalance]
  )
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const initialJavaScript = useInitialJavaScript(
    route.params.currency,
    jsonBalances,
    e164PhoneNumber
  )
  const dispatch = useDispatch()

  // Update balances when they change
  useEffect(() => {
    webViewRef.current?.injectJavaScript(`
      window.valora.balances = ${jsonBalances}
    `)
  }, [jsonBalances])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {initialJavaScript && (
        <WebView
          ref={webViewRef}
          source={{ uri: networkConfig.bidaliUrl }}
          onLoadEnd={onLoadEnd}
          onMessage={onMessage}
          injectedJavaScriptBeforeContentLoaded={initialJavaScript}
        />
      )}
    </SafeAreaView>
  )
}

BidaliScreen.navigationOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerTitle: 'Bidali',
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
    headerRight: () => (
      <ActivityIndicator
        style={styles.headerActivityIndicator}
        size="small"
        color={colors.greenBrand}
      />
    ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActivityIndicator: {
    marginRight: 16,
  },
})

export default BidaliScreen
