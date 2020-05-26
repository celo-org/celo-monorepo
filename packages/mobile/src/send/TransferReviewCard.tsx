import TextButton from '@celo/react-components/components/TextButton.v2'
import withTextInputLabeling from '@celo/react-components/components/WithTextInputLabeling'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { TokenTransactionType } from 'src/apollo/types'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { Recipient } from 'src/recipients/recipient'

const CommentInput = withTextInputLabeling<TextInputProps>(TextInput)

interface Props {
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
  validatedRecipientAddress?: string
  onEditAddressClick?: () => void
}

// Content placed in a ReviewFrame
// Differs from TransferConfirmationCard which is used for viewing completed txs
export default function TransferReviewCard({
  recipient,
  address,
  e164PhoneNumber,
  currency,
  type,
  value,
  comment,
  fee,
  isLoadingFee,
  feeError,
  validatedRecipientAddress,
  onEditAddressClick,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const isInvite = type === TokenTransactionType.InviteSent
  const inviteFee = getInvitationVerificationFeeInDollars()
  const inviteFeeAmount = {
    value: inviteFee,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }

  // 'fee' already contains the invitation fee for invites
  // so we adjust it here
  const securityFee = isInvite && fee ? fee.minus(inviteFee) : fee

  const securityFeeAmount = securityFee && {
    value: securityFee,
    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
  }
  const subtotalAmount = value.isGreaterThan(0) && {
    value,
    currencyCode: CURRENCIES[currency].code,
  }
  const displayAmount = subtotalAmount || inviteFeeAmount
  const totalAmount = {
    value: value.plus(fee || 0),
    currencyCode: CURRENCIES[currency].code,
  }

  return (
    <View style={styles.transferContainer}>
      <Avatar recipient={recipient} address={address} e164Number={e164PhoneNumber} />
      {validatedRecipientAddress && (
        <View style={styles.editContainer}>
          <Text>{`${validatedRecipientAddress.slice(0, 6)}...${validatedRecipientAddress.slice(
            -4
          )}`}</Text>
          <TextButton testID={'accountEditButton'} onPress={onEditAddressClick}>
            {t('edit')}
          </TextButton>
        </View>
      )}
      <CurrencyDisplay type={DisplayType.Big} style={styles.amount} amount={displayAmount} />
      <CommentInput
        title={t('global:for')}
        placeholder={t('groceriesRent')}
        value={this.state.reason}
        maxLength={MAX_COMMENT_LENGTH}
        onChangeText={this.onReasonChanged}
      />
      <View style={styles.bottomContainer}>
        {!!comment && <Text style={styles.comment}>{comment}</Text>}
        {/* Replace with the fee drawer */}
        {/* <HorizontalLine />
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
        )} */}
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
        {/* <HorizontalLine /> */}
        <TotalLineItem amount={totalAmount} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  transferContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 25,
  },
  editContainer: {
    flexDirection: 'row',
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
    ...componentStyles.paddingTop5,
    ...fontStyles.light,
    fontSize: 14,
    color: colors.darkSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
})
