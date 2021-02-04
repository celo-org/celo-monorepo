import { StackScreenProps } from '@react-navigation/stack'
import { useEffect, useRef } from 'react'
import * as React from 'react'
import { BackHandler, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import WebView, { WebViewRef } from 'src/components/WebView'
import { VALORA_LOGO_URL } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import config from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const RAMP_URI = config.rampWidgetUrl

const navigateHome = () => navigate(Screens.WalletHome)

export const rampOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerTitle: (RAMP_URI.match(/(?!(w+)\.)\w*(?:\w+\.)+\w+/) || [])[0],
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
  }
}

type RouteProps = StackScreenProps<StackParamList, Screens.Ramp>
type Props = RouteProps

function FiatExchangeWeb({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)
  const asset = {
    [CURRENCY_ENUM.GOLD]: 'CELO',
    [CURRENCY_ENUM.DOLLAR]: 'CUSD',
  }[currencyToBuy]
  const finalUrl = 'https://valoraapp.com/?done=true'
  const uri = `
    ${RAMP_URI}
      ?userAddress=${account}
      &swapAsset=${asset}
      &hostAppName=Valora
      &hostLogoUrl=${VALORA_LOGO_URL}
      &fiatCurrency=${currencyCode}
      &fiatValue=${localAmount}
      &finalUrl=${encodeURI(finalUrl)}
    `.replace(/\s+/g, '')

  const onNavigationStateChange = ({ url }: any) => url === finalUrl && navigateHome()

  const webview = useRef<WebViewRef>(null)
  const onAndroidBackPress = (): boolean => {
    if (webview.current) {
      webview.current.goBack()
      return true
    }
    return false
  }
  useEffect((): (() => void) => {
    BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress)
    return (): void => {
      BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress)
    }
  }, [])

  return (
    <View style={styles.container}>
      <WebView ref={webview} source={{ uri }} onNavigationStateChange={onNavigationStateChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
})

export default FiatExchangeWeb
