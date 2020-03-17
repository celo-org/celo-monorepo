import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { RecipientWithContact } from 'src/recipients/recipient'

interface Props {
  recipientPhone: string
  recipientContact?: RecipientWithContact
  amount: BigNumber
  fee?: BigNumber
  isLoadingFee?: boolean
  feeError?: Error
  currency: CURRENCY_ENUM
}

export default function ReclaimPaymentConfirmationCard({
  recipientPhone,
  recipientContact,
  amount: amountProp,
  fee,
  isLoadingFee,
  feeError,
  currency,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const amount = { value: amountProp, currencyCode: CURRENCIES[currency].code }
  const securityFeeAmount = fee && {
    value: fee.negated(),
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }
  const totalAmount = {
    value: amountProp.minus(fee || 0),
    currencyCode: amount.currencyCode,
  }

  return (
    <View style={styles.container}>
      <Avatar recipient={recipientContact} e164Number={recipientPhone} />
      <CurrencyDisplay type={DisplayType.Big} amount={amount} />
      <HorizontalLine />
      <LineItemRow title={t('amount')} amount={<CurrencyDisplay amount={amount} />} />
      <LineItemRow
        title={t('securityFee')}
        titleIcon={<FeeIcon />}
        amount={
          securityFeeAmount && (
            <CurrencyDisplay amount={securityFeeAmount} formatType={FormatType.Fee} />
          )
        }
        isLoading={isLoadingFee}
        hasError={!!feeError}
      />
      <HorizontalLine />
      <TotalLineItem title={t('totalRefunded')} amount={totalAmount} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
})
