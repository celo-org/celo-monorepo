// VIEW Small component that has the details of a withdrawal transaction

import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'

interface WithdrawCeloProps {
  style?: ViewStyle
  amount: BigNumber
  recipientAddress: string
  feeEstimate: BigNumber
}

export default function WithdrawCeloSummary({
  style,
  amount,
  recipientAddress,
  feeEstimate,
}: WithdrawCeloProps) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)

  return (
    <View style={style}>
      <LineItemRow
        title={t('exchangeFlow9:withdrawCeloAmount')}
        textStyle={fontStyles.regular}
        amount={
          <CurrencyDisplay
            amount={{
              value: amount,
              currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
            }}
          />
        }
      />
      <FeeDrawer
        testID={'feeDrawer/WithdrawCelo'}
        currency={CURRENCY_ENUM.GOLD}
        isExchange={false}
        isEstimate={true}
        securityFee={feeEstimate}
        totalFee={feeEstimate}
      />
      <TotalLineItem
        amount={{
          value: amount,
          currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
        }}
      />
    </View>
  )
}
