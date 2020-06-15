import { TFunction } from 'i18next'
import * as _ from 'lodash'
import { TokenTransactionType, UserTransactionsQuery } from 'src/apollo/types'
import { DEFAULT_TESTNET } from 'src/config'
import { decryptComment } from 'src/identity/commentEncryption'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { NumberToRecipient } from 'src/recipients/recipient'
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

export function getTransferFeedParams(
  type: TokenTransactionType,
  t: TFunction,
  recipientCache: NumberToRecipient,
  address: string,
  addressToE164Number: AddressToE164NumberType,
  rawComment: string | null,
  commentKey: string | null
) {
  const e164PhoneNumber = addressToE164Number[address]
  const recipient = e164PhoneNumber ? recipientCache[e164PhoneNumber] : undefined
  const nameOrNumber = recipient ? recipient.displayName : e164PhoneNumber
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
      title = t('feedItemSentTitle', {
        context: !nameOrNumber ? 'noReceiverDetails' : null,
        nameOrNumber,
      })
      info = t('feedItemSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionType.Received: {
      title = t('feedItemReceivedTitle', {
        context: !nameOrNumber ? 'noSenderDetails' : null,
        nameOrNumber,
      })
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
