import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { Namespaces } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'

interface Props {
  makerAmount: MoneyAmount
  takerAmount: MoneyAmount
  showFinePrint?: boolean
}

type DisplayedAmount = Pick<MoneyAmount, 'value' | 'currencyCode'>

function getDisplayedAmount(
  amount: MoneyAmount,
  localCurrencyCode: LocalCurrencyCode
): DisplayedAmount {
  if (
    amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code ||
    (amount.currencyCode === CURRENCIES[CURRENCY_ENUM.DOLLAR].code &&
      localCurrencyCode === LocalCurrencyCode.USD)
  ) {
    return amount
  }

  return amount.localAmount || amount
}

const getExchangeRate = (makerAmount: DisplayedAmount, takerAmount: DisplayedAmount) => {
  return new BigNumber(makerAmount.value).dividedBy(takerAmount.value)
}

export default function ExchangeRate({ makerAmount, takerAmount, showFinePrint }: Props) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  const localCurrencyCode = useLocalCurrencyCode()

  const displayedMakerAmount = getDisplayedAmount(makerAmount, localCurrencyCode)
  const displayedTakerAmount = getDisplayedAmount(takerAmount, localCurrencyCode)
  const rate = getExchangeRate(displayedMakerAmount, displayedTakerAmount)
  const isRateValid = !rate.isZero() && rate.isFinite()
  const takerTokenCode = displayedTakerAmount.currencyCode

  return (
    <View style={styles.rate}>
      <Text style={styles.rateText}>
        {isRateValid ? t('exchangeRate') : t('loadingExchangeRate')}
      </Text>
      {isRateValid && (
        <Text style={styles.ratio} testID="ExchangeRateRatio">
          <Trans
            i18nKey="exchangeRateValue"
            ns={Namespaces.exchangeFlow9}
            values={{ takerTokenCode }}
          >
            <CurrencyDisplay
              amount={{ value: rate, currencyCode: displayedMakerAmount.currencyCode }}
              formatType={FormatType.ExchangeRate}
              hideSymbol={true}
              hideCode={false}
              showLocalAmount={false}
            />{' '}
            : 1 {{ takerTokenCode }}
          </Trans>
        </Text>
      )}
      {showFinePrint && <Text style={styles.finePrint}>{t('includeExchangeFee')}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  rate: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  rateText: {
    ...fontStyles.bodySecondary,
    textAlign: 'center',
  },
  ratio: {
    textAlign: 'center',
    color: colors.dark,
  },
  finePrint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.darkSecondary,
  },
})
