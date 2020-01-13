import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React, { useCallback } from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useExchangeRate } from 'src/exchange/hooks'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { goldToDollarAmount } from 'src/utils/currencyExchange'
import { getLocalCurrencyDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

interface OwnProps {
  testID: string
}

type Props = WithTranslation & OwnProps

export function CeloGoldOverview({ t, testID }: Props) {
  useBalanceAutoRefresh()
  const localCurrencyCode = useLocalCurrencyCode()
  const displayLocalCurrency = useCallback(
    (amount: BigNumber.Value) =>
      getLocalCurrencyDisplayValue(amount, localCurrencyCode || LocalCurrencyCode.USD, true),
    [localCurrencyCode]
  )
  const exchangeRate = useExchangeRate()
  const goldToDollars = useCallback((amount) => goldToDollarAmount(amount, exchangeRate), [
    exchangeRate,
  ])
  const localExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const dollarsToLocal = useCallback(
    (amount) => convertDollarsToLocalAmount(amount, localExchangeRate),
    [localExchangeRate]
  )

  const goldBalance = useSelector((state) => state.goldToken.balance)
  const localValue = goldBalance ? dollarsToLocal(goldToDollars(goldBalance)) : null

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{t('global:celoGold')}</Text>
      <Text style={styles.balance}>
        {goldBalance && (
          <Text style={fontStyles.semiBold}>{getMoneyDisplayValue(goldBalance)}</Text>
        )}
      </Text>
      <Text style={styles.localBalance}>
        {localValue
          ? t('equalToAmount', { amount: displayLocalCurrency(localValue) })
          : t('loadingExchangeRate')}
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
    ...fontStyles.light,
    fontSize: 18,
    color: '#B0B5B9',
  },
  code: {
    fontSize: 22,
  },
})

export default withTranslation(Namespaces.exchangeFlow9)(CeloGoldOverview)
