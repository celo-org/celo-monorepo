// Wallet utilities for comment encryption and comment key management
// Use these instead of the functions in @celo/utils/src/commentEncryption
// because these manage comment metadata

import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { bufferToHex, hexToBuffer } from '@celo/utils/src/address'
import {
  decryptComment as decryptCommentRaw,
  deriveCEK,
  encryptComment as encryptCommentRaw,
} from '@celo/utils/src/commentEncryption'
import { memoize, values } from 'lodash'
import { call, put, select } from 'redux-saga/effects'
import { isTokenTxTypeSent } from 'src/apollo/types'
import { features } from 'src/flags'
import {
  getUserSelfPhoneHashDetails,
  PhoneNumberHashDetails,
  SALT_CHAR_LENGTH,
} from 'src/identity/privacy'
import { NewTransactionsInFeedAction } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { setPrivateCommentKey } from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'
import { privateCommentKeySelector } from 'src/web3/selectors'

const TAG = 'identity/commentKey'
// A separator to split the comment content from the metadata
const METADATA_CONTENT_SEPARATOR = '~'
// Format should be separator + e164Number + salt
const PHONE_METADATA_REGEX = new RegExp(
  `(.*)${METADATA_CONTENT_SEPARATOR}([+][1-9][0-9]{1,14})([a-zA-Z0-9+/]{${SALT_CHAR_LENGTH}})$`
)

// Derive a new comment key from the provided private key
export function* createCommentKey(seedPrivateKey: string) {
  Logger.debug(TAG, 'Creating a new comment key')
  const privateCEK = bufferToHex(deriveCEK(seedPrivateKey))
  yield put(setPrivateCommentKey(privateCEK))
}

export function* getCommentKey(address: string) {
  const contractKit = yield call(getContractKit)
  const accountsWrapper: AccountsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAccounts,
  ])
  const hexString: string = yield call(accountsWrapper.getDataEncryptionKey, address)
  // No comment key -> empty string returned from getDEK. This is expected for old addresses created before comment encryption change
  return !hexString ? null : hexToBuffer(hexString)
}

export function* encryptComment(
  comment: string | null,
  toAddress: string | null,
  fromAddress: string | null,
  includePhoneNumMetadata: boolean
) {
  Logger.debug(TAG, 'Encrypting comment')
  if (!features.USE_COMMENT_ENCRYPTION || !comment || !toAddress || !fromAddress) {
    Logger.debug(TAG, 'Invalid params, skipping encryption')
    return comment
  }

  // TODO currently users register this key when the get verified
  // We should nudge unverified users to register a key as well otherwise
  // they don't benefit from comment encryption
  const fromKey: Buffer | null = yield call(getCommentKey, fromAddress)
  if (!fromKey) {
    Logger.debug(TAG, 'No sender key found, skipping encryption')
    return comment
  }

  const toKey: Buffer | null = yield call(getCommentKey, toAddress)
  if (!toKey) {
    Logger.debug(TAG, 'No recipient key found, skipping encryption')
    return comment
  }

  let commentToEncrypt = comment
  if (features.PHONE_NUM_METADATA_IN_TRANSFERS && includePhoneNumMetadata) {
    const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield call(
      getUserSelfPhoneHashDetails
    )
    commentToEncrypt = embedPhoneNumberMetadata(comment, selfPhoneDetails)
  }

  const { comment: encryptedComment, success } = encryptCommentRaw(commentToEncrypt, toKey, fromKey)

  if (success) {
    Logger.debug(TAG, 'Comment encryption succeeded')
    return encryptedComment
  } else {
    Logger.error(TAG, 'Encryting comment failed, returning raw comment')
    return comment
  }
}

interface DecryptedComment {
  comment: string | null
  e164Number?: string
  salt?: string
}

// Memoize to avoid computing decryptions more than once per comment
// TODO investigate whether its worth it to save this in persisted state, maybe Apollo cache?
export const decryptComment = memoize(_decryptComment, (...args) => values(args).join('_'))

function _decryptComment(
  comment: string | null,
  commentKeyPrivate: string | null,
  isSender: boolean
): DecryptedComment {
  Logger.debug(TAG, 'Decrypting comment')

  if (!features.USE_COMMENT_ENCRYPTION || !comment || !commentKeyPrivate) {
    Logger.debug(TAG, 'Invalid params, skipping decryption')
    return { comment }
  }

  const { comment: decryptedComment, success } = decryptCommentRaw(
    comment,
    hexToBuffer(commentKeyPrivate),
    isSender
  )

  if (success) {
    Logger.debug(TAG, 'Comment decryption succeeded')
    return extractPhoneNumberMetadata(decryptedComment)
  } else {
    Logger.error(TAG, 'Decrypting comment failed, returning raw comment')
    return { comment }
  }
}

export function embedPhoneNumberMetadata(
  comment: string,
  phoneNumberDetails?: PhoneNumberHashDetails
) {
  return phoneNumberDetails
    ? comment + METADATA_CONTENT_SEPARATOR + phoneNumberDetails.e164Number + phoneNumberDetails.salt
    : comment
}

export function extractPhoneNumberMetadata(commentData: string) {
  const phoneNumMetadata = commentData.match(PHONE_METADATA_REGEX)
  if (!phoneNumMetadata || phoneNumMetadata.length < 4) {
    return { comment: commentData }
  }

  return {
    comment: phoneNumMetadata[1],
    e164Number: phoneNumMetadata[2],
    salt: phoneNumMetadata[3],
  }
}

// Check tx comments (if they exist) for identity metadata like phone numbers and salts
export function* checkTxsForIdentityMetadata({ transactions }: NewTransactionsInFeedAction) {
  if (!transactions || !transactions.length) {
    return
  }

  const commentKeyPrivate: string | null = yield select(privateCommentKeySelector)
  if (!commentKeyPrivate) {
    Logger.error(
      TAG + 'checkTxsForIdentityMetadata',
      'Missing comment key. Should never happen here.'
    )
    return
  }

  const newIdentityData: DecryptedComment[] = []
  // Check all comments for metadata
  for (const tx of transactions) {
    if (tx.__typename !== 'TokenTransfer') {
      continue
    }
    const decryptedComment = decryptComment(
      tx.comment,
      commentKeyPrivate,
      isTokenTxTypeSent(tx.type)
    )
    if (!decryptedComment.e164Number || !decryptedComment.salt) {
      continue
    }
    Logger.debug(TAG + 'checkTxsForIdentityMetadata', `Found metadata in tx hash ${tx.hash}`)
    newIdentityData.push(decryptedComment)
  }

  if (!newIdentityData.length) {
    return
  }

  // Verify the metadata claims (they could be spoofed)
}
