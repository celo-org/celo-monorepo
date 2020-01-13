import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { Namespaces, withTranslation } from 'src/i18n'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { useLocalCurrencyCode, useLocalCurrencySymbol } from 'src/localCurrency/hooks'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { getMoneyDisplayValue } from 'src/utils/formatting'

type Props = WithTranslation

function CeloDollarsOverview({ t }: Props) {
  useBalanceAutoRefresh()
  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const dollarBalance = useSelector((state) => state.stableToken.balance)
  const localExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localBalance = convertDollarsToLocalAmount(dollarBalance, localExchangeRate)
  const localValue =
    localBalance || dollarBalance === null
      ? getMoneyDisplayValue(localBalance || 0)
      : getMoneyDisplayValue(dollarBalance || 0)

  return (
    <View style={styles.container}>
      <Text style={styles.balance}>
        <Text style={fontStyles.semiBold}>{localCurrencySymbol}</Text>
        <Text style={fontStyles.semiBold}>{localValue}</Text>
        <Text style={styles.code}> {localBalance ? localCurrencyCode : ''}</Text>
      </Text>
      {!!localCurrencyCode && (
        <Text style={styles.localBalance}>
          <Text>{getMoneyDisplayValue(dollarBalance || 0)} </Text>
          <Text>{t('global:celoDollars')}</Text>
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 20,
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

export default componentWithAnalytics(withTranslation(Namespaces.walletFlow5)(CeloDollarsOverview))
