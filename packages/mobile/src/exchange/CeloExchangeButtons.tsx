// VIEW which contains buy and sell buttons for CELO.

import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import { CURRENCY_ENUM } from '@celo/utils'
import { StackNavigationProp } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DOLLAR_TRANSACTION_MIN_AMOUNT, GOLD_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { exchangeRatePairSelector } from 'src/exchange/reducer'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

interface Props {
  navigation: StackNavigationProp<StackParamList, Screens.ExchangeHomeScreen>
}

export default function CeloExchangeButtons({ navigation }: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)

  const dollarBalance = useSelector(stableTokenBalanceSelector)
  const goldBalance = useSelector(celoTokenBalanceSelector)
  const exchangeRate = useSelector(exchangeRatePairSelector)

  const hasDollars = new BigNumber(dollarBalance || 0).isGreaterThan(DOLLAR_TRANSACTION_MIN_AMOUNT)
  const hasGold = new BigNumber(goldBalance || 0).isGreaterThan(GOLD_TRANSACTION_MIN_AMOUNT)

  function goToBuyGold() {
    ValoraAnalytics.track(CeloExchangeEvents.celo_home_buy)
    navigation.navigate(Screens.ExchangeTradeScreen, {
      makerTokenDisplay: {
        makerToken: CURRENCY_ENUM.DOLLAR,
        makerTokenBalance: dollarBalance || '0',
      },
    })
  }

  function goToBuyDollars() {
    ValoraAnalytics.track(CeloExchangeEvents.celo_home_sell)
    navigation.navigate(Screens.ExchangeTradeScreen, {
      makerTokenDisplay: {
        makerToken: CURRENCY_ENUM.GOLD,
        makerTokenBalance: goldBalance || '0',
      },
    })
  }

  if (!exchangeRate || (!hasDollars && !hasGold)) {
    return <View style={styles.emptyContainer} />
  }

  return (
    <View style={styles.buttonContainer}>
      {hasDollars && (
        <Button
          text={t('buy')}
          size={BtnSizes.FULL}
          onPress={goToBuyGold}
          style={styles.button}
          type={BtnTypes.TERTIARY}
        />
      )}
      {hasGold && (
        <Button
          size={BtnSizes.FULL}
          text={t('sell')}
          onPress={goToBuyDollars}
          style={styles.button}
          type={BtnTypes.TERTIARY}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    marginTop: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    marginTop: 24,
    marginBottom: 28,
    marginHorizontal: 12,
  },
  button: {
    marginHorizontal: 4,
    flex: 1,
  },
})
