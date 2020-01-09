import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TransactionType, TransferItemFragment } from 'src/apollo/types'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees } from 'src/invite/actions'
import { useLocalCurrencyCode, useLocalCurrencySymbol } from 'src/localCurrency/hooks'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/reducer'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import { decryptComment, getTransferFeedParams } from 'src/transactions/transferFeedUtils'
import { getMoneyDisplayValue, getNetworkFeeDisplayValue } from 'src/utils/formatting'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

type Props = TransferItemFragment & {
  type: TransactionType
  status?: TransactionStatus
  invitees: Invitees
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
  commentKey: Buffer | null
}

function navigateToTransactionReview({
  address,
  type,
  comment,
  commentKey,
  timestamp,
  amount,
  invitees,
  addressToE164Number,
  recipientCache,
}: Props) {
  // TODO: remove this when verification reward drilldown is supported
  if (type === TransactionType.VerificationReward) {
    return
  }

  const recipient = getRecipientFromAddress(
    address,
    type === TransactionType.InviteSent ? invitees : addressToE164Number,
    recipientCache
  )

  navigateToPaymentTransferReview(type, timestamp, {
    address,
    comment: decryptComment(comment, commentKey, type),
    currency:
      amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
        ? CURRENCY_ENUM.GOLD
        : CURRENCY_ENUM.DOLLAR,
    value: new BigNumber(amount.amount),
    recipient,
    type,
    // fee TODO: add fee here.
  })
}

export function TransferFeedItem(props: Props) {
  const { t, i18n } = useTranslation(Namespaces.walletFlow5)

  const onItemPress = () => {
    navigateToTransactionReview(props)
  }

  const {
    amount,
    address,
    timestamp,
    type,
    comment,
    commentKey,
    status,
    invitees,
    addressToE164Number,
    recipientCache,
  } = props

  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const moneyAmount = localCurrencyCode && amount.localAmount ? amount.localAmount : amount
  const value = new BigNumber(moneyAmount.amount)
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const direction = value.isNegative() ? '-' : ''
  const isPending = status === TransactionStatus.Pending
  const transactionValue =
    type === TransactionType.NetworkFee
      ? getNetworkFeeDisplayValue(value.absoluteValue())
      : getMoneyDisplayValue(value.absoluteValue())

  const { title, info, recipient } = getTransferFeedParams(
    type,
    t,
    invitees,
    recipientCache,
    address,
    addressToE164Number,
    comment,
    commentKey
  )

  return (
    <Touchable onPress={onItemPress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <TransferFeedIcon type={type} recipient={recipient} address={address} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text
              style={[
                direction === '-'
                  ? fontStyles.activityCurrencySent
                  : {
                      ...fontStyles.activityCurrencyReceived,
                      color:
                        amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
                          ? colors.celoGold
                          : colors.celoGreen,
                    },
                styles.amount,
              ]}
            >
              {direction}
              {localCurrencySymbol}
              {transactionValue}
            </Text>
          </View>
          {!!info && <Text style={styles.info}>{info}</Text>}
          <View style={[styles.statusContainer, !!info && styles.statusContainerUnderComment]}>
            {isPending && (
              <Text style={styles.transactionStatus}>
                <Text style={styles.textPending}>{t('confirmingPayment')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Complete && (
              <Text style={styles.transactionStatus}>{dateTimeFormatted}</Text>
            )}
            {status === TransactionStatus.Failed && (
              <Text style={styles.transactionStatus}>
                <Text style={styles.textStatusFailed}>{t('paymentFailed')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Touchable>
  )
}

TransferFeedItem.fragments = {
  transfer: gql`
    fragment TransferItem on TransactionTransfer {
      __typename
      type
      hash
      amount {
        amount
        currencyCode
        localAmount {
          amount
          currencyCode
          exchangeRate
        }
      }
      timestamp
      address
      comment
    }
  `,
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    padding: variables.contentPadding,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: -1,
  },
  title: {
    ...fontStyles.semiBold,
    fontSize: 15,
    color: colors.dark,
  },
  info: {
    ...fontStyles.comment,
    marginTop: -2,
  },
  amount: {
    marginLeft: 'auto',
    paddingLeft: 10,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainerUnderComment: {
    marginTop: 8,
  },
  textPending: {
    ...fontStyles.bodySmallBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.celoGreen,
  },
  transactionStatus: {
    ...fontStyles.bodySmall,
    color: colors.lightGray,
  },
  textStatusFailed: {
    ...fontStyles.semiBold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.darkSecondary,
  },
  localAmount: {
    marginLeft: 'auto',
    paddingLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.lightGray,
  },
})

export default TransferFeedItem
