import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Recipient } from 'src/recipients/recipient'

interface Props {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  e164PhoneNumber?: string
  recipient?: Recipient
}

// Content placed in a ReviewFrame for summarizing a payment request
export default function PaymentRequestReviewCard({
  recipient,
  address,
  e164PhoneNumber,
  currency,
  value,
  comment,
}: Props) {
  const amount = { value, currencyCode: CURRENCIES[currency].code }
  const totalAmount = amount // TODO: add fee?

  return (
    <View style={styles.container}>
      <Avatar recipient={recipient} address={address} e164Number={e164PhoneNumber} />
      <CurrencyDisplay type={DisplayType.Big} style={styles.amount} amount={amount} />
      {!!comment && <Text style={styles.comment}>{comment}</Text>}
      <HorizontalLine />
      <TotalLineItem amount={totalAmount} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'column',
    paddingVertical: 25,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  amount: {
    marginTop: 15,
  },
  comment: {
    ...fontStyles.light,
    ...componentStyles.paddingTop5,
    fontSize: 14,
    color: colors.darkSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
})
