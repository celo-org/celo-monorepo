import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { startBalanceAutorefresh, stopBalanceAutorefresh } from 'src/home/actions'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { Namespaces, withTranslation } from 'src/i18n'
import {
  useDollarsToLocalAmount,
  useLocalCurrencyCode,
  useLocalCurrencySymbol,
} from 'src/localCurrency/hooks'
import useSelector from 'src/redux/useSelector'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  goldEducationCompleted: boolean
  stableEducationCompleted: boolean
  goldBalance: string | null
  dollarBalance: string | null
}

interface OwnProps {
  testID: string
}

interface DispatchProps {
  startBalanceAutorefresh: typeof startBalanceAutorefresh
  stopBalanceAutorefresh: typeof stopBalanceAutorefresh
}

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

export function CeloGoldOverview({ t }: Props) {
  useBalanceAutoRefresh()
  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const exchangeRatePair = useSelector((state) => state.exchange.exchangeRatePair)

  const goldBalance = useSelector((state) => state.goldToken.balance)
  const exchangeRate = getRateForMakerToken(
    exchangeRatePair,
    CURRENCY_ENUM.DOLLAR,
    CURRENCY_ENUM.GOLD
  )
  const isRateValid = !exchangeRate.isZero() && exchangeRate.isFinite()
  const dollarValue = getTakerAmount(goldBalance, exchangeRate)
  const localBalance = useDollarsToLocalAmount(dollarValue)
  let localValue =
    localBalance || dollarValue === null
      ? getMoneyDisplayValue(localBalance || 0)
      : getMoneyDisplayValue(dollarValue || 0)
  if (localCurrencySymbol) {
    localValue = localCurrencySymbol + localValue
  } else if (localCurrencyCode) {
    localValue = localValue + ' ' + localCurrencyCode
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('celoGold')}</Text>
      <Text style={styles.balance}>
        <Text style={fontStyles.semiBold}>{getMoneyDisplayValue(goldBalance || 0)}</Text>
      </Text>
      <Text style={[fontStyles.light, styles.localBalance]}>
        {isRateValid ? t('equalToAmount', { amount: localValue }) : t('loadingExchangeRate')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    ...fontStyles.semiBold,
  },
  label: {
    fontSize: 18,
    color: colors.dark,
  },
  balance: {
    fontSize: 44,
    // TODO: figure out why specifying the lineHeight with the font we're using
    // breaks the vertical centering. Then remove the hardcoded height here!
    lineHeight: 62,
    height: 48,
    color: colors.dark,
  },
  localBalance: {
    fontSize: 18,
    color: '#B0B5B9',
  },
  code: {
    fontSize: 22,
  },
})

export default withTranslation(Namespaces.exchangeFlow9)(CeloGoldOverview)
