import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TokenTransactionType } from 'src/apollo/types'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { Recipient } from 'src/recipients/recipient'

export interface OwnProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  fee?: BigNumber
  isLoadingFee?: boolean
  feeError?: Error
  type: TokenTransactionType
  e164PhoneNumber?: string
  recipient?: Recipient
}

// Content placed in a ReviewFrame
// Differs from TransferConfirmationCard which is used for viewing completed txs
function TransferReviewCard({
  recipient,
  address,
  e164PhoneNumber,
  currency,
  t,
  type,
  value,
  comment,
  fee,
  isLoadingFee,
  feeError,
}: OwnProps & WithTranslation) {
  const isInvite = type === TokenTransactionType.InviteSent
  const inviteFee = getInvitationVerificationFeeInDollars()
  const inviteFeeAmount = {
    value: inviteFee.toString(),
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  // 'fee' already contains the invitation fee for invites
  // so we adjust it here
  const securityFee = isInvite && fee ? fee.minus(inviteFee) : fee

  const securityFeeAmount = securityFee && {
    value: securityFee.toString(),
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }
  const subtotalAmount = value.isGreaterThan(0) && {
    value: value.toString(),
    currencyCode: CURRENCIES[currency].code,
  }
  const amount = subtotalAmount || inviteFeeAmount
  const totalAmount = {
    value: value.plus(fee || 0).toString(),
    currencyCode: CURRENCIES[currency].code,
  }

  return (
    <View style={styles.container}>
      <Avatar recipient={recipient} address={address} e164Number={e164PhoneNumber} />
      <CurrencyDisplay type={DisplayType.Big} style={styles.amount} amount={amount} />
      <View style={styles.bottomContainer}>
        {!!comment && <Text style={[styles.pSmall, componentStyles.paddingTop5]}>{comment}</Text>}
        <HorizontalLine />
        {subtotalAmount && (
          <LineItemRow
            title={t('global:subtotal')}
            amount={<CurrencyDisplay amount={subtotalAmount} />}
          />
        )}
        {isInvite && (
          <LineItemRow
            title={t('inviteFee')}
            amount={<CurrencyDisplay amount={inviteFeeAmount} />}
          />
        )}
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
        <TotalLineItem amount={totalAmount} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 25,
  },
  bottomContainer: {
    marginTop: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  amount: {
    marginTop: 15,
    color: colors.darkSecondary,
  },
  pSmall: {
    fontSize: 14,
    color: colors.darkSecondary,
    ...fontStyles.light,
    lineHeight: 18,
    textAlign: 'center',
  },
})

export default withTranslation(Namespaces.sendFlow7)(TransferReviewCard)
