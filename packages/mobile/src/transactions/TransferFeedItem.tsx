import gql from 'graphql-tag'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType, TransferItemFragment } from 'src/apollo/types'
import { txHashToFeedInfoSelector } from 'src/fiatExchanges/reducer'
import { Namespaces } from 'src/i18n'
import {
  addressToDisplayNameSelector,
  AddressToDisplayNameType,
  AddressToE164NumberType,
} from 'src/identity/reducer'
import { InviteDetails } from 'src/invite/actions'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import TransactionFeedItem from 'src/transactions/TransactionFeedItem'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import {
  getDecryptedTransferFeedComment,
  getTransferFeedParams,
} from 'src/transactions/transferFeedUtils'
import { TransactionStatus } from 'src/transactions/types'

type Props = TransferItemFragment & {
  type: TokenTransactionType
  status: TransactionStatus
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
  recentTxRecipientsCache: NumberToRecipient
  invitees: InviteDetails[]
  commentKey: string | null
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
  addressToDisplayName,
}: Props & { addressToDisplayName: AddressToDisplayNameType }) {
  // TODO: remove this when verification reward drilldown is supported
  if (type === TokenTransactionType.VerificationReward) {
    return
  }

  const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
  const e164PhoneNumber = addressToE164Number[address] || undefined

  navigateToPaymentTransferReview(
    type,
    timestamp,
    {
      address,
      comment: getDecryptedTransferFeedComment(comment, commentKey, type),
      amount,
      recipient,
      type,
      e164PhoneNumber,
      // fee TODO: add fee here.
    },
    addressToDisplayName
  )
}

export function TransferFeedItem(props: Props) {
  const { t } = useTranslation(Namespaces.walletFlow5)
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)

  const onPress = () => {
    navigateToTransactionReview({ ...props, addressToDisplayName })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const {
    amount,
    address,
    timestamp,
    type,
    hash,
    comment,
    commentKey,
    status,
    addressToE164Number,
    recipientCache,
    recentTxRecipientsCache,
    invitees,
  } = props
  const txInfo = txHashToFeedInfo[hash]

  const { title, info, recipient } = getTransferFeedParams(
    type,
    t,
    recipientCache,
    recentTxRecipientsCache,
    txInfo?.name || addressToDisplayName[address]?.name,
    address,
    addressToE164Number,
    comment,
    commentKey,
    timestamp,
    invitees
  )
  const imageUrl = (txInfo?.icon || addressToDisplayName[address]?.imageUrl) ?? null

  return (
    <TransactionFeedItem
      type={type}
      amount={amount}
      title={title}
      info={info}
      icon={
        <TransferFeedIcon type={type} recipient={recipient} address={address} imageUrl={imageUrl} />
      }
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
