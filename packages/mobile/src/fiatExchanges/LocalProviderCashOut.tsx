import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.LocalProviderCashOut>
type Props = RouteProps

export const localProviderCashOutOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
  }
}

function LocalProviderCashOut({ route }: Props) {
  const { uri } = route.params

  return (
    <View style={styles.container}>
      <WebView style={styles.exchangeWebView} source={{ uri }} />
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

export default LocalProviderCashOut
