import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TokenTransactionType, TransferItemFragment } from 'src/apollo/types'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { Namespaces } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/reducer'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import { decryptComment, getTransferFeedParams } from 'src/transactions/transferFeedUtils'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

type Props = TransferItemFragment & {
  type: TokenTransactionType
  status: TransactionStatus
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
  addressToE164Number,
  recipientCache,
}: Props) {
  // TODO: remove this when verification reward drilldown is supported
  if (type === TokenTransactionType.VerificationReward) {
    return
  }

  const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)

  navigateToPaymentTransferReview(type, timestamp, {
    address,
    comment: decryptComment(comment, commentKey, type),
    amount,
    recipient,
    type,
    // fee TODO: add fee here.
  })
}

// TODO(jeanregisser): ExchangeFeedItem and TransferFeedItem renders are very similar, we should use the same building blocks
// so the parts that need to be identical stay the same as we change the code (main layout)
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
    addressToE164Number,
    recipientCache,
  } = props

  const isSent = new BigNumber(amount.value).isNegative()
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const isPending = status === TransactionStatus.Pending

  const { title, info, recipient } = getTransferFeedParams(
    type,
    t,
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
            <CurrencyDisplay
              amount={amount}
              formatType={
                type === TokenTransactionType.NetworkFee ? FormatType.NetworkFee : undefined
              }
              style={[
                styles.amount,
                isSent ? fontStyles.activityCurrencySent : fontStyles.activityCurrencyReceived,
              ]}
            />
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
    fragment TransferItem on TokenTransfer {
      __typename
      type
      hash
      amount {
        value
        currencyCode
        localAmount {
          value
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
})

export default TransferFeedItem
