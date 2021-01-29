import { TFunction } from 'i18next'
import * as _ from 'lodash'
import {
  ExchangeItemFragment,
  TokenTransactionType,
  TransferItemFragment,
  UserTransactionsQuery,
} from 'src/apollo/types'
import { DEFAULT_TESTNET } from 'src/config'
import { decryptComment } from 'src/identity/commentEncryption'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { InviteDetails } from 'src/invite/actions'
import {
  getDisplayName,
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  RecipientInfo,
} from 'src/recipients/recipient'
import { KnownFeedTransactionsType } from 'src/transactions/reducer'
import { isPresent } from 'src/utils/typescript'

export function getDecryptedTransferFeedComment(
  comment: string | null,
  commentKey: string | null,
  type: TokenTransactionType
) {
  const { comment: decryptedComment } = decryptComment(comment, commentKey, isTokenTxTypeSent(type))
  return decryptedComment
}

// Hacky way to get escrow recipients until blockchain API
// returns correct address (currently returns Escrow SC address)
function getEscrowSentRecipientPhoneNumber(invitees: InviteDetails[], txTimestamp: number) {
  const possiblePhoneNumbers = new Set()
  invitees.forEach((inviteDetails) => {
    const inviteTimestamp = inviteDetails.timestamp
    // Invites are logged before invite tx is confirmed so considering a match
    // to be when escrow tx timestamp is within 30 secs of invite timestamp
    if (Math.abs(txTimestamp - inviteTimestamp) < 1000 * 30) {
      possiblePhoneNumbers.add(inviteDetails.e164Number)
    }
  })

  // Set to null if there isn't a conclusive match
  if (possiblePhoneNumbers.size !== 1) {
    return null
  }

  return possiblePhoneNumbers.values().next().value
}

function getRecipient(
  type: TokenTransactionType,
  e164PhoneNumber: string | null,
  recipientCache: NumberToRecipient,
  recentTxRecipientsCache: NumberToRecipient,
  txTimestamp: number,
  invitees: InviteDetails[],
  address: string,
  recipientInfo: RecipientInfo
) {
  let phoneNumber = e164PhoneNumber
  let recipient: Recipient

  if (type === TokenTransactionType.EscrowSent) {
    phoneNumber = getEscrowSentRecipientPhoneNumber(invitees, txTimestamp)
  }

  if (phoneNumber) {
    // Use the recentTxRecipientCache until the full cache is populated
    recipient = Object.keys(recipientCache).length
      ? recipientCache[phoneNumber]
      : recentTxRecipientsCache[phoneNumber]

    if (recipient) {
      Object.assign(recipient, { address })
      return recipient
    }
  }
  return getRecipientFromAddress(address, recipientInfo)
}

export function getTransferFeedParams(
  type: TokenTransactionType,
  t: TFunction,
  phoneRecipientCache: NumberToRecipient,
  recentTxRecipientsCache: NumberToRecipient,
  address: string,
  addressToE164Number: AddressToE164NumberType,
  rawComment: string | null,
  commentKey: string | null,
  timestamp: number,
  invitees: InviteDetails[],
  recipientInfo: RecipientInfo
) {
  const e164PhoneNumber = addressToE164Number[address]
  const recipient = getRecipient(
    type,
    e164PhoneNumber,
    phoneRecipientCache,
    recentTxRecipientsCache,
    timestamp,
    invitees,
    address,
    recipientInfo
  )
  Object.assign(recipient, { address })
  const nameOrNumber = recipient?.name || e164PhoneNumber
  const displayName = getDisplayName(recipient, t)
  const comment = getDecryptedTransferFeedComment(rawComment, commentKey, type)

  let title, info

  switch (type) {
    case TokenTransactionType.VerificationFee: {
      title = t('feedItemVerificationFeeTitle')
      info = t('feedItemVerificationFeeInfo')
      break
    }
    case TokenTransactionType.NetworkFee: {
      title = t('feedItemNetworkFeeTitle')
      info = t('feedItemNetworkFeeInfo')
      break
    }
    case TokenTransactionType.VerificationReward: {
      title = t('feedItemVerificationRewardTitle')
      info = t('feedItemVerificationRewardInfo')
      break
    }
    case TokenTransactionType.Faucet: {
      title = t('feedItemFaucetTitle')
      info = t('feedItemFaucetInfo', {
        context: !DEFAULT_TESTNET ? 'noTestnet' : null,
        faucet: DEFAULT_TESTNET ? _.startCase(DEFAULT_TESTNET) : null,
      })
      break
    }
    case TokenTransactionType.InviteSent: {
      title = t('feedItemInviteSentTitle')
      info = t('feedItemInviteSentInfo', {
        context: !nameOrNumber ? 'noInviteeDetails' : null,
        nameOrNumber,
      })
      break
    }
    case TokenTransactionType.InviteReceived: {
      title = t('feedItemInviteReceivedTitle')
      info = t('feedItemInviteReceivedInfo')
      break
    }
    case TokenTransactionType.Sent: {
      title = t('feedItemSentTitle', { displayName })
      info = t('feedItemSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionType.Received: {
      title = t('feedItemReceivedTitle', { displayName })
      info = t('feedItemReceivedInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionType.EscrowSent: {
      title = t('feedItemEscrowSentTitle', {
        context: !nameOrNumber ? 'noReceiverDetails' : null,
        nameOrNumber,
      })
      info = t('feedItemEscrowSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionType.EscrowReceived: {
      title = t('feedItemEscrowReceivedTitle', {
        context: !nameOrNumber ? 'noSenderDetails' : null,
        nameOrNumber,
      })
      info = t('feedItemEscrowReceivedInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    default: {
      title = t('feedItemGenericTitle', {
        context: !nameOrNumber ? 'noRecipientDetails' : null,
        nameOrNumber,
      })
      // Fallback to just using the type
      info = comment || _.capitalize(t(_.camelCase(type)))
      break
    }
  }
  return { title, info, recipient }
}

export function getTxsFromUserTxQuery(data: UserTransactionsQuery | undefined) {
  return data?.tokenTransactions?.edges.map((edge) => edge.node).filter(isPresent) ?? []
}

export function getNewTxsFromUserTxQuery(
  data: UserTransactionsQuery | undefined,
  knownFeedTxs: KnownFeedTransactionsType
) {
  const txFragments = getTxsFromUserTxQuery(data)
  return txFragments.filter((tx) => !knownFeedTxs[tx.hash])
}

export function isTokenTxTypeSent(type: TokenTransactionType) {
  return type === TokenTransactionType.Sent || type === TokenTransactionType.EscrowSent
}

export function isTransferTransaction(
  tx: TransferItemFragment | ExchangeItemFragment
): tx is TransferItemFragment {
  return (tx as TransferItemFragment).address !== undefined
}
