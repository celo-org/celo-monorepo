import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { Namespaces, withTranslation } from 'src/i18n'
import useSelector from 'src/redux/useSelector'

interface OwnProps {
  testID: string
}

type Props = WithTranslation & OwnProps

export function CeloGoldOverview({ t, testID }: Props) {
  useBalanceAutoRefresh()
  const goldBalance = useSelector((state) => state.goldToken.balance)

  const goldBalanceAmount = goldBalance
    ? { value: goldBalance, currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code }
    : null

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{t('global:celoGold')}</Text>
      <Text style={styles.balance}>
        {goldBalanceAmount && (
          <CurrencyDisplay style={fontStyles.semiBold} amount={goldBalanceAmount} />
        )}
      </Text>
      <Text style={styles.localBalance}>
        {goldBalanceAmount ? (
          <Trans i18nKey="equalToAmount" ns={Namespaces.exchangeFlow9}>
            Equal to <CurrencyDisplay amount={goldBalanceAmount} showLocalAmount={true} />
          </Trans>
        ) : (
          t('loadingExchangeRate')
        )}
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
