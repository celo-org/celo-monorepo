import { decryptComment as decryptCommentRaw } from '@celo/utils/src/commentEncryption'
import { TFunction } from 'i18next'
import * as _ from 'lodash'
import { TransactionType } from 'src/apollo/types'
import { DEFAULT_TESTNET } from 'src/config'
import { features } from 'src/flags'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees } from 'src/invite/actions'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'

export function decryptComment(
  comment: string | null | undefined,
  commentKey: Buffer | null,
  type: TransactionType
) {
  return comment && commentKey && features.USE_COMMENT_ENCRYPTION
    ? decryptCommentRaw(
        comment,
        commentKey,
        type === TransactionType.Sent || type === TransactionType.EscrowSent
      ).comment
    : comment
}

export function getTransferFeedParams(
  type: TransactionType,
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
    case TransactionType.VerificationFee: {
      title = t('feedItemVerificationFeeTitle')
      info = t('feedItemVerificationFeeInfo')
      break
    }
    case TransactionType.NetworkFee: {
      title = t('feedItemNetworkFeeTitle')
      info = t('feedItemNetworkFeeInfo')
      break
    }
    case TransactionType.VerificationReward: {
      title = t('feedItemVerificationRewardTitle')
      info = t('feedItemVerificationRewardInfo')
      break
    }
    case TransactionType.Faucet: {
      title = t('feedItemFaucetTitle')
      info = t('feedItemFaucetInfo', {
        context: !DEFAULT_TESTNET ? 'missingTestnet' : null,
        faucet: DEFAULT_TESTNET ? _.startCase(DEFAULT_TESTNET) : null,
      })
      break
    }
    case TransactionType.InviteSent: {
      const inviteeE164Number = invitees[address]
      const inviteeRecipient = recipientCache[inviteeE164Number]
      title = t('feedItemInviteSentTitle')
      info = t('feedItemInviteSentInfo', {
        context: !inviteeE164Number ? 'missingInviteeDetails' : null,
        nameOrNumber: inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number,
      })
      break
    }

    case TransactionType.InviteReceived: {
      title = t('feedItemInviteReceivedTitle')
      info = t('feedItemInviteReceivedInfo')
      break
    }
    default: {
      recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
      const shortAddr = address.substring(0, 8)

      if (recipient) {
        title = recipient.displayName
      } else if (type === TransactionType.Received) {
        title = t('feedItemReceivedTitle', { context: 'missingSenderDetails', address: shortAddr })
      } else if (type === TransactionType.Sent) {
        title = t('feedItemSentTitle', { context: 'missingReceiverDetails', address: shortAddr })
      } else if (type === TransactionType.EscrowSent) {
        title = t('feedItemSentTitle', { context: 'escrowSent', address: shortAddr })
      } else if (type === TransactionType.EscrowReceived) {
        title = t('feedItemReceivedTitle', { context: 'escrowRecieved', address: shortAddr })
      } else {
        // Fallback to just using the type
        title = _.capitalize(t(_.camelCase(type)))
      }
    }
  }
  return { title, info, recipient }
}
