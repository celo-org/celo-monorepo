// VIEW Small component that has the details of a withdrawal transaction

import fontStyles from '@celo/react-components/styles/fonts.v2'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow.v2'
import TotalLineItem from 'src/components/TotalLineItem.v2'
import { FeeType } from 'src/fees/actions'
import CalculateFee from 'src/fees/CalculateFee'
import { getFeeDollars } from 'src/fees/selectors'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { currentAccountSelector } from 'src/web3/selectors'

interface WithdrawCeloProps {
  style?: ViewStyle
  amount: BigNumber
  recipientAddress: string
}

export default function WithdrawCeloSummary({
  style,
  amount,
  recipientAddress,
}: WithdrawCeloProps) {
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  const currentAccount = useSelector(currentAccountSelector)

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
      <CalculateFee
        feeType={FeeType.SEND}
        account={currentAccount || ''}
        amount={amount}
        comment=""
        recipientAddress={recipientAddress}
        includeDekFee={false}
      >
        {(asyncFee) => {
          const fee = getFeeDollars(asyncFee.result)
          return (
            <FeeDrawer
              testID={'feeDrawer/WithdrawCelo'}
              currency={CURRENCY_ENUM.GOLD}
              isExchange={false}
              isEstimate={true}
              feeLoading={asyncFee.loading}
              feeHasError={!!asyncFee.error}
              securityFee={fee}
              totalFee={fee}
            />
          )
        }}
      </CalculateFee>
      <TotalLineItem
        amount={{
          value: amount,
          currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
        }}
      />
    </View>
  )
}
