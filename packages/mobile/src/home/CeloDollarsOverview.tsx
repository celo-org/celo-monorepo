import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import useSelector from 'src/redux/useSelector'

type Props = WithTranslation

function CeloDollarsOverview({ t }: Props) {
  useBalanceAutoRefresh()
  const localCurrencyCode = useLocalCurrencyCode()
  const dollarBalance = useSelector((state) => state.stableToken.balance)

  const isUsdLocalCurrency = localCurrencyCode === LocalCurrencyCode.USD
  const dollarBalanceAmount = dollarBalance
    ? { value: dollarBalance, currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code }
    : null

  return (
    <View style={styles.container}>
      {dollarBalanceAmount && (
        <Text style={styles.balance}>
          <CurrencyDisplay style={fontStyles.semiBold} amount={dollarBalanceAmount} />
        </Text>
      )}
      {!isUsdLocalCurrency && dollarBalanceAmount && (
        <Text style={styles.dollarBalance}>
          <Trans i18nKey="dollarBalance" ns={Namespaces.walletFlow5}>
            <CurrencyDisplay
              amount={dollarBalanceAmount}
              showLocalAmount={false}
              hideSymbol={true}
            />{' '}
            Celo Dollars
          </Trans>
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
  dollarBalance: {
    ...fontStyles.light,
    fontSize: 18,
    color: '#B0B5B9',
  },
})

export default componentWithAnalytics(withTranslation(Namespaces.walletFlow5)(CeloDollarsOverview))
