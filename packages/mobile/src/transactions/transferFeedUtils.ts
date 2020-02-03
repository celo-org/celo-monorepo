import { decryptComment as decryptCommentRaw } from '@celo/utils/src/commentEncryption'
import { TFunction } from 'i18next'
import * as _ from 'lodash'
import { TokenTransactionType } from 'src/apollo/types'
import { DEFAULT_TESTNET } from 'src/config'
import { features } from 'src/flags'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees } from 'src/invite/actions'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'

export function decryptComment(
  comment: string | null | undefined,
  commentKey: Buffer | null,
  type: TokenTransactionType
) {
  return comment && commentKey && features.USE_COMMENT_ENCRYPTION
    ? decryptCommentRaw(
        comment,
        commentKey,
        type === TokenTransactionType.Sent || type === TokenTransactionType.EscrowSent
      ).comment
    : comment
}

export function getTransferFeedParams(
  type: TokenTransactionType,
  t: TFunction,
  invitees: Invitees,
  recipientCache: NumberToRecipient,
  address: string,
  addressToE164Number: AddressToE164NumberType,
  comment: string | null,
  commentKey: Buffer | null
) {
  let info = decryptComment(comment, commentKey, type)
  let title, recipient

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
        context: !DEFAULT_TESTNET ? 'missingTestnet' : null,
        faucet: DEFAULT_TESTNET ? _.startCase(DEFAULT_TESTNET) : null,
      })
      break
    }
    case TokenTransactionType.InviteSent: {
      const inviteeE164Number = invitees[address]
      const inviteeRecipient = recipientCache[inviteeE164Number]
      title = t('feedItemInviteSentTitle')
      info = t('feedItemInviteSentInfo', {
        context: !inviteeE164Number ? 'missingInviteeDetails' : null,
        nameOrNumber: inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number,
      })
      break
    }

    case TokenTransactionType.InviteReceived: {
      title = t('feedItemInviteReceivedTitle')
      info = t('feedItemInviteReceivedInfo')
      break
    }
    default: {
      recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
      const shortAddr = address.substring(0, 8)

      if (recipient) {
        title = recipient.displayName
      } else if (type === TokenTransactionType.Received) {
        title = t('feedItemReceivedTitle', { context: 'missingSenderDetails', address: shortAddr })
      } else if (type === TokenTransactionType.Sent) {
        title = t('feedItemSentTitle', { context: 'missingReceiverDetails', address: shortAddr })
      } else if (type === TokenTransactionType.EscrowSent) {
        title = t('feedItemSentTitle', { context: 'escrowSent', address: shortAddr })
      } else if (type === TokenTransactionType.EscrowReceived) {
        title = t('feedItemReceivedTitle', { context: 'escrowRecieved', address: shortAddr })
      } else {
        // Fallback to just using the type
        title = _.capitalize(t(_.camelCase(type)))
      }
    }
  }
  return { title, info, recipient }
}
