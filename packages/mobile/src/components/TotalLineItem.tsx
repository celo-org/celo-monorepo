import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useExchangeRate, useLocalCurrencyCode } from 'src/localCurrency/hooks'

interface Props {
  title?: string
  amount: MoneyAmount
}

export default function TotalLineItem({ title, amount }: Props) {
  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencyExchangeRate = useExchangeRate()
  const { t } = useTranslation(Namespaces.global)

  return (
    <>
      <LineItemRow
        title={title || t('total')}
        textStyle={fontStyles.bodyBold}
        amount={<CurrencyDisplay amount={amount} />}
      />
      {localCurrencyCode !== LocalCurrencyCode.USD && localCurrencyExchangeRate && (
        <LineItemRow
          title={
            <Trans i18nKey="totalInDollars" ns={Namespaces.global}>
              Celo Dollars (@{' '}
              <CurrencyDisplay
                amount={{
                  value: new BigNumber(localCurrencyExchangeRate).pow(-1),
                  currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                }}
                showLocalAmount={false}
              />
              )
            </Trans>
          }
          amount={<CurrencyDisplay amount={amount} showLocalAmount={false} hideSymbol={true} />}
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
    color: colors.darkSecondary,
  },
})
