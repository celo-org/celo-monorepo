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
import { call, put } from 'redux-saga/effects'
import { features } from 'src/flags'
import {
  getUserSelfPhoneHashDetails,
  PhoneNumberHashDetails,
  SALT_CHAR_LENGTH,
} from 'src/identity/privacy'
import Logger from 'src/utils/Logger'
import { setPrivateCommentKey } from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'

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

export const decryptComment = memoize(_decryptComment, (...args) => values(args).join('_'))

function _decryptComment(comment: string | null, commentKey: string | null, isSender: boolean) {
  Logger.debug(TAG, 'Decrypting comment')

  if (!features.USE_COMMENT_ENCRYPTION || !comment || !commentKey) {
    Logger.debug(TAG, 'Invalid params, skipping decryption')
    return comment
  }

  const { comment: decryptedComment, success } = decryptCommentRaw(
    comment,
    hexToBuffer(commentKey),
    isSender
  )

  if (success) {
    Logger.debug(TAG, 'Comment decryption succeeded')
    const { content, e164Number, salt } = extractPhoneNumberMetadata(decryptedComment)
    // TODO confirm and register e164Number + salt somehow
    return content
  } else {
    Logger.error(TAG, 'Decrypting comment failed, returning raw comment')
    return comment
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
    return { content: commentData }
  }

  return {
    content: phoneNumMetadata[1],
    e164Number: phoneNumMetadata[2],
    salt: phoneNumMetadata[3],
  }
}
