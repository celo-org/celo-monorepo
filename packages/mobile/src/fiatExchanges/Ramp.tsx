import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import WebView from 'src/components/WebView'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { RAMP_URI, VALORA_LOGO_URL } from 'src/config'
import config from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

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

  return (
    <View style={styles.container}>
      <WebView
        source={{
          uri: `
          ${RAMP_URI}
            ?userAddress=${account}
            &swapAsset=${asset}
            &hostAppName=Valora
            &hostLogoUrl=${VALORA_LOGO_URL}
            &fiatCurrency=${currencyCode}
            &fiatValue=${localAmount}
          `.replace(/\s+/g, ''),
        }}
      />
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
