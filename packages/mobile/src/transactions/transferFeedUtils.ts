import { decryptComment as decryptCommentRaw } from '@celo/utils/src/commentEncryption'
import { TranslationFunction } from 'i18next'
import * as _ from 'lodash'
import { DEFAULT_TESTNET } from 'src/config'
import { features } from 'src/flags'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees } from 'src/invite/actions'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { TransactionTypes } from 'src/transactions/reducer'

export function decryptComment(
  comment: string | undefined,
  commentKey: Buffer | null,
  type: TransactionTypes
) {
  return comment && commentKey && features.USE_COMMENT_ENCRYPTION
    ? decryptCommentRaw(comment, commentKey, type === TransactionTypes.SENT).comment
    : comment
}

export function getTransferFeedParams(
  type: TransactionTypes,
  t: TranslationFunction,
  invitees: Invitees,
  recipientCache: NumberToRecipient,
  address: string,
  addressToE164Number: AddressToE164NumberType,
  comment: string,
  commentKey: Buffer | null
) {
  let info = decryptComment(comment, commentKey, type)
  let title, recipient

  switch (type) {
    case TransactionTypes.VERIFICATION_FEE: {
      title = t('feedItemVerificationFeeTitle')
      info = t('feedItemVerificationFeeInfo')
      break
    }
    case TransactionTypes.NETWORK_FEE: {
      title = t('feedItemNetworkFeeTitle')
      info = t('feedItemNetworkFeeInfo')
      break
    }
    case TransactionTypes.VERIFICATION_REWARD: {
      title = t('feedItemVerificationRewardTitle')
      info = t('feedItemVerificationRewardInfo')
      break
    }
    case TransactionTypes.FAUCET: {
      title = t('feedItemFaucetTitle')
      info = t('feedItemFaucetInfo', {
        context: !DEFAULT_TESTNET ? 'missingTestnet' : null,
        faucet: DEFAULT_TESTNET ? _.startCase(DEFAULT_TESTNET) : null,
      })
      break
    }
    case TransactionTypes.INVITE_SENT: {
      const inviteeE164Number = invitees[address]
      const inviteeRecipient = recipientCache[inviteeE164Number]
      title = t('feedItemInviteSentTitle')
      info = t('feedItemInviteSentInfo', {
        context: !inviteeE164Number ? 'missingInviteeDetails' : null,
        nameOrNumber: inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number,
      })
      break
    }
    case TransactionTypes.INVITE_RECEIVED: {
      title = t('feedItemInviteReceivedTitle')
      info = t('feedItemInviteReceivedInfo')
      break
    }
    default: {
      recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
      const shortAddr = address.substring(0, 8)

      if (recipient) {
        title = recipient.displayName
      } else if (type === TransactionTypes.RECEIVED) {
        title = t('feedItemReceivedTitle', { context: 'missingSenderDetails', address: shortAddr })
      } else if (type === TransactionTypes.SENT) {
        title = t('feedItemSentTitle', { context: 'missingReceiverDetails', address: shortAddr })
      } else {
        // Fallback to just using the type
        title = _.capitalize(t(_.camelCase(type)))
      }
    }
  }
  return { title, info, recipient }
}
