import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useSelector } from 'react-redux'
import AccountNumber from 'src/components/AccountNumber'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const SIMPLEX_URI = 'https://stage-dot-clabs-valora-web.uc.r.appspot.com/simplex'

export const simplexOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
  }
}

type RouteProps = StackScreenProps<StackParamList, Screens.Simplex>
type Props = RouteProps

function Simplex({ route }: Props) {
  const { localAmount, currencyCode } = route.params
  const account = useSelector(currentAccountSelector)

  Logger.info(
    `Loading Simplex widget for amount ${localAmount} with currency ${currencyCode} for account ${account}`
  )
  return (
    <View style={styles.container}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.gray2,
          paddingHorizontal: 10,
          paddingBottom: 20,
          backgroundColor: colors.gray1,
        }}
      >
        <Text style={fontStyles.regular}>{`Tap to copy your Valora cUSD address`}</Text>
        <AccountNumber address={account || ''} />
      </View>
      <WebView style={styles.exchangeWebView} source={{ uri: SIMPLEX_URI }} />
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

export default Simplex
