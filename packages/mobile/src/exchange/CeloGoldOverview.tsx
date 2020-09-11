import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
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
      <Text style={styles.title}>{t('yourGoldBalance')}</Text>
      <Text style={styles.balance}>
        {goldBalanceAmount && <CurrencyDisplay amount={goldBalanceAmount} />}
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
    marginVertical: 16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: 8,
  },
  label: {
    color: colors.dark,
  },
  balance: {
    ...fontStyles.mediumNumber,
    color: colors.dark,
    marginBottom: 8,
  },
  localBalance: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  code: {},
})

export default withTranslation<Props>(Namespaces.exchangeFlow9)(CeloGoldOverview)
