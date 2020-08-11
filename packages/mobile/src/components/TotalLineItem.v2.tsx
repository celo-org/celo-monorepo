import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow.v2'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useExchangeRate, useLocalCurrencyCode } from 'src/localCurrency/hooks'

interface Props {
  title?: string
  amount: MoneyAmount
  hideSign?: boolean
}

export default function TotalLineItem({ title, amount, hideSign }: Props) {
  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencyExchangeRate = useExchangeRate()
  const { t } = useTranslation(Namespaces.global)

  const exchangeRate = amount.localAmount?.exchangeRate || localCurrencyExchangeRate

  return (
    <>
      <LineItemRow
        title={title || t('total')}
        textStyle={fontStyles.regular600}
        amount={<CurrencyDisplay amount={amount} hideSign={hideSign} />}
      />
      {localCurrencyCode !== LocalCurrencyCode.USD && exchangeRate && (
        <LineItemRow
          title={
            <Trans i18nKey="totalInDollars" ns={Namespaces.global}>
              Celo Dollars @{' '}
              <CurrencyDisplay
                amount={{
                  value: new BigNumber(exchangeRate).pow(-1),
                  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                }}
                showLocalAmount={false}
              />
            </Trans>
          }
          amount={
            <CurrencyDisplay
              amount={amount}
              showLocalAmount={false}
              hideSymbol={true}
              hideSign={hideSign}
            />
          }
          style={styles.dollars}
          textStyle={styles.dollarsText}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  dollars: {
    marginVertical: 0,
  },
  dollarsText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})
