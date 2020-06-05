import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { SIGN_MOONPAY_FIREBASE_URL } from 'src/config'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { currentAccountSelector } from 'src/web3/selectors'

const celoCurrencyCode = 'CUSD'

function FiatExchangeWeb() {
  const [uri, setUri] = React.useState('')
  const account = useSelector(currentAccountSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  React.useEffect(() => {
    const getSignedUrl = async () => {
      const response = await fetch(SIGN_MOONPAY_FIREBASE_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        // TODO: Add amount here
        body: JSON.stringify({
          currency: celoCurrencyCode,
          address: account,
          fiatCurrency: localCurrencyCode,
        }),
      })
      const json = await response.json()
      return json.url
    }

    getSignedUrl()
      .then(setUri)
      .catch(() => showError(ErrorMessages.FIREBASE_FAILED)) // Firebase signing function failed
  }, [])

  return (
    <View style={styles.container}>
      {uri === '' ? (
        <ActivityIndicator size="large" color={colors.celoGreen} />
      ) : (
        <WebView style={styles.exchangeWebView} source={{ uri }} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
  exchangeWebView: {
    opacity: 0.99,
  },
})

export default FiatExchangeWeb
