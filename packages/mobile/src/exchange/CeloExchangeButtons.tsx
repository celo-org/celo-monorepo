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
import { getCeloBalance } from 'src/goldToken/selectors'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDollarBalance } from 'src/stableToken/selectors'

interface Props {
  navigation: StackNavigationProp<StackParamList, Screens.ExchangeHomeScreen>
}

export default function CeloExchangeButtons({ navigation }: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)

  const dollarBalance = useSelector(getDollarBalance)
  const goldBalance = useSelector(getCeloBalance)

  const hasDollars = new BigNumber(dollarBalance || 0).isGreaterThan(0)
  const hasGold = new BigNumber(goldBalance || 0).isGreaterThan(0)

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

  if (!hasDollars && !hasGold) {
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
