import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { Namespaces } from 'src/i18n'
import useLocalAmount from 'src/localCurrency/useLocalAmount'
import useSelector from 'src/redux/useSelector'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface OwnProps {
  // testID: string
}

type Props = WithNamespaces & OwnProps

function CeloDollarsOverview({ t }: Props) {
  useBalanceAutoRefresh()
  const dollarBalance = useSelector((state) => state.stableToken.balance)
  const localBalance = useLocalAmount(dollarBalance)

  return (
    <View style={styles.container}>
      <Text style={[fontStyles.semiBold, styles.label]}>{t('global:celoDollars')}</Text>
      <Text style={[fontStyles.semiBold, styles.balance]}>
        {getMoneyDisplayValue(dollarBalance || 0)}
      </Text>
      <Text style={[fontStyles.light, styles.localBalance]}>
        Equal to{' '}
        <Text style={fontStyles.semiBold}>
          {localBalance ? getMoneyDisplayValue(localBalance) : '---'} MXN
        </Text>
      </Text>
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
    fontSize: 18,
    color: '#B0B5B9',
  },
})

export default componentWithAnalytics(withNamespaces(Namespaces.walletFlow5)(CeloDollarsOverview))
