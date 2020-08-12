import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import config from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const celoCurrencyCode = 'celo'

export const moonPayOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
  }
}

type RouteProps = StackScreenProps<StackParamList, Screens.MoonPay>
type Props = RouteProps

function FiatExchangeWeb({ route }: Props) {
  const [uri, setUri] = React.useState('')
  const { localAmount, currencyCode } = route.params
  const account = useSelector(currentAccountSelector)

  React.useEffect(() => {
    const getSignedUrl = async () => {
      const response = await fetch(config.signMoonpayUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: celoCurrencyCode,
          address: account,
          fiatCurrency: currencyCode,
          fiatAmount: localAmount?.toString(),
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
        <ActivityIndicator size="large" color={colors.greenBrand} />
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
