import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { features } from 'src/flags'
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
        <CurrencyDisplay style={styles.localBalance} amount={dollarAmount} />
        <CurrencyDisplay
          style={styles.dollarBalance}
          amount={dollarAmount}
          showLocalAmount={false}
          hideFullCurrencyName={false}
          hideSymbol={true}
        />
      </View>
      <View>
        <ListItem onPress={goToAddFunds}>
          <Text style={styles.optionTitle}>{t('fiatExchangeFlow:addFunds')}</Text>
        </ListItem>
        {features.SHOW_CASH_OUT ? (
          <ListItem onPress={goToCashOut}>
            <Text style={styles.optionTitle}>{t('fiatExchangeFlow:cashOut')}</Text>
          </ListItem>
        ) : (
          <ListItem>
            <Text style={styles.optionTitleComingSoon}>
              {t('fiatExchangeFlow:cashOutComingSoon')}
            </Text>
          </ListItem>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: { height: 200 },
  balanceSheet: {
    paddingVertical: variables.contentPadding,
    paddingRight: variables.contentPadding,
    marginLeft: variables.contentPadding,
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
    backgroundColor: colors.light,
  },

  optionTitle: {
    ...fontStyles.regular,
  },
  optionTitleComingSoon: {
    ...fontStyles.regular,
    color: colors.gray3,
  },
})

export default FiatExchange
