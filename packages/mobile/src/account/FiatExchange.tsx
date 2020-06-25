import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { useSelector } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { SHOW_CASH_OUT } from 'src/config'
import ListItem from 'src/fiatExchanges/ListItem'
import { Namespaces } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { Screens } from 'src/navigator/Screens'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

function FiatExchange() {
  function goToAddFunds() {
    navigation.navigate(Screens.FiatExchangeAmount, { isAddFunds: true })
  }

  function goToCashOut() {
    navigation.navigate(Screens.FiatExchangeAmount, { isAddFunds: false })
  }

  const { t } = useTranslation()
  const navigation = useNavigation()
  const localCurrencyCode = useLocalCurrencyCode()
  const isUsdLocalCurrency = localCurrencyCode === LocalCurrencyCode.USD
  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const dollarAmount = {
    value: dollarBalance ?? '0',
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <View style={styles.image} />
      <View style={styles.balanceSheet}>
        <Text style={styles.currentBalance}>{t('global:currentBalance')}</Text>
        <CurrencyDisplay
          style={styles.localBalance}
          amount={dollarAmount}
          showLocalAmount={!isUsdLocalCurrency}
        />
        {!isUsdLocalCurrency && (
          <Text style={styles.dollarBalance}>
            <Trans i18nKey="dollarBalance" ns={Namespaces.walletFlow5}>
              <CurrencyDisplay showLocalAmount={false} hideSymbol={true} amount={dollarAmount} />{' '}
              Celo Dollars
            </Trans>
          </Text>
        )}
      </View>
      <View>
        <ListItem onPress={goToAddFunds}>
          <Text style={styles.optionTitle}>{t('fiatExchangeFlow:addFunds')}</Text>
        </ListItem>
        {SHOW_CASH_OUT && (
          <ListItem onPress={goToCashOut}>
            <Text style={styles.optionTitle}>{t('fiatExchangeFlow:cashOut')}</Text>
          </ListItem>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  image: { height: 200 },
  balanceSheet: {
    paddingVertical: variables.contentPadding,
    paddingRight: variables.contentPadding,
    marginLeft: variables.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    height: 112,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  currentBalance: {
    ...fontStyles.h2,
    marginBottom: 4,
  },
  localBalance: {
    ...fontStyles.large,
    marginBottom: 2,
  },
  dollarBalance: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  option: {
    backgroundColor: colors.background,
  },

  optionTitle: {
    ...fontStyles.regular,
    // marginLeft: variables.contentPadding,
  },
  optionTitleComingSoon: {
    ...fontStyles.regular,
    color: colors.gray3,
    paddingLeft: variables.contentPadding,
  },
})

export default FiatExchange
