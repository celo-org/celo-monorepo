import gql from 'graphql-tag'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TokenTransactionType, TransferItemFragment } from 'src/apollo/types'
import { Namespaces } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/reducer'
import TransactionFeedItem from 'src/transactions/TransactionFeedItem'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import { decryptComment, getTransferFeedParams } from 'src/transactions/transferFeedUtils'

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

export function TransferFeedItem(props: Props) {
  const { t } = useTranslation(Namespaces.walletFlow5)

  const onPress = () => {
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
    <TransactionFeedItem
      type={type}
      amount={amount}
      title={title}
      info={info}
      icon={<TransferFeedIcon type={type} recipient={recipient} address={address} />}
      timestamp={timestamp}
      status={status}
      onPress={onPress}
    />
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

export default TransferFeedItem
