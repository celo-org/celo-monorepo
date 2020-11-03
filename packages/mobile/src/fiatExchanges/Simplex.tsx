import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useSelector } from 'react-redux'
import AccountNumber from 'src/components/AccountNumber'
import { SIMPLEX_URI } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { currentAccountSelector } from 'src/web3/selectors'

export const simplexOptions = () => {
  const navigateToFiatExchange = () => navigate(Screens.FiatExchange)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarTextButton title={i18n.t('global:done')} onPress={navigateToFiatExchange} />
    ),
  }
}

function Simplex() {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const account = useSelector(currentAccountSelector)

  return (
    <View style={styles.container}>
      <View style={styles.addressBanner}>
        <Text style={[styles.tapToCopy, fontStyles.regular]}>
          {t('tapToCopyCeloDollarsAddress')}
        </Text>
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
  addressBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    padding: 10,
    backgroundColor: colors.gray1,
  },
  tapToCopy: {
    marginBottom: 10,
  },
  exchangeWebView: {
    opacity: 0.99,
  },
})

export default Simplex
