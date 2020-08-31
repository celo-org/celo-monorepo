// Wallet utilities for comment encryption and comment key management
// Use these instead of the functions in @celo/utils/src/commentEncryption
// because these manage comment metadata

import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { IdentifierLookupResult } from '@celo/contractkit/lib/wrappers/Attestations'
import { eqAddress, hexToBuffer } from '@celo/utils/src/address'
import {
  decryptComment as decryptCommentRaw,
  encryptComment as encryptCommentRaw,
} from '@celo/utils/src/commentEncryption'
import { getPhoneHash } from '@celo/utils/src/phoneNumbers'
import { memoize, values } from 'lodash'
import { call, put, select } from 'redux-saga/effects'
import { TokenTransactionType, TransactionFeedFragment } from 'src/apollo/types'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { features } from 'src/flags'
import i18n from 'src/i18n'
import { updateE164PhoneNumberAddresses, updateE164PhoneNumberSalts } from 'src/identity/actions'
import {
  getAddressesFromLookupResult,
  lookupAttestationIdentifiers,
} from 'src/identity/contactMapping'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import {
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
  e164NumberToSaltSelector,
  E164NumberToSaltType,
} from 'src/identity/reducer'
import { NewTransactionsInFeedAction } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'identity/commentKey'
// A separator to split the comment content from the metadata
const METADATA_CONTENT_SEPARATOR = '~'
// Format should be separator + e164Number + salt
const PHONE_METADATA_REGEX = new RegExp(
  `(.*)${METADATA_CONTENT_SEPARATOR}([+][1-9][0-9]{1,14})([a-zA-Z0-9+/]{13})$`
)

export function* encryptComment(
  comment: string | null,
  toAddress: string | null,
  fromAddress: string | null,
  includePhoneNumMetadata: boolean = false
) {
  Logger.debug(TAG + 'encryptComment', 'Encrypting comment')
  if (!features.USE_COMMENT_ENCRYPTION || !comment || !toAddress || !fromAddress) {
    Logger.debug(TAG, 'Invalid params, skipping encryption')
    return comment
  }

  const fromKey: Buffer | null = yield call(doFetchDataEncryptionKey, fromAddress)
  if (!fromKey) {
    Logger.debug(TAG + 'encryptComment', 'No sender key found, skipping encryption')
    return comment
  }

  const toKey: Buffer | null = yield call(doFetchDataEncryptionKey, toAddress)
  if (!toKey) {
    Logger.debug(TAG + 'encryptComment', 'No recipient key found, skipping encryption')
    return comment
  }

  let commentToEncrypt = comment
  if (features.PHONE_NUM_METADATA_IN_TRANSFERS && includePhoneNumMetadata) {
    Logger.debug(TAG + 'encryptComment', 'Including phone number metadata in comment')
    const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield call(
      getUserSelfPhoneHashDetails
    )
    commentToEncrypt = embedPhoneNumberMetadata(comment, selfPhoneDetails)
  }

  const { comment: encryptedComment, success } = encryptCommentRaw(commentToEncrypt, toKey, fromKey)

  if (success) {
    Logger.debug(TAG + 'encryptComment', 'Encryption succeeded')
    return encryptedComment
  } else {
    Logger.error(TAG + 'encryptComment', 'Encrytion failed, returning raw comment')
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
  dataEncryptionKey: string | null,
  isSender: boolean
): DecryptedComment {
  Logger.debug(TAG + 'decryptComment', 'Decrypting comment')

  if (!features.USE_COMMENT_ENCRYPTION || !comment || !dataEncryptionKey) {
    Logger.debug(TAG + 'decryptComment', 'Invalid params, skipping decryption')
    return { comment }
  }

  const { comment: decryptedComment, success } = decryptCommentRaw(
    comment,
    hexToBuffer(dataEncryptionKey),
    isSender
  )

  if (success) {
    Logger.debug(TAG + 'decryptComment', 'Comment decryption succeeded')
    return extractPhoneNumberMetadata(decryptedComment)
  } else if (comment.length <= MAX_COMMENT_LENGTH) {
    Logger.warn(TAG + 'decryptComment', 'Decrypting comment failed, returning raw comment')
    return { comment }
  } else {
    // Since we've changed the DEK derivation strategy, comment decryption would fail
    // for old comments and/or mismatch between DEK types btwn sender + receiver
    // To cover this case, the comment is hidden instead of showing garbage
    Logger.warn(TAG + 'decryptComment', 'Comment appears to be ciphertext, hiding comment')
    return { comment: i18n.t('global:commentUnavailable') }
  }
}

export function embedPhoneNumberMetadata(
  comment: string,
  phoneNumberDetails?: PhoneNumberHashDetails
) {
  return phoneNumberDetails
    ? comment +
        METADATA_CONTENT_SEPARATOR +
        phoneNumberDetails.e164Number +
        phoneNumberDetails.pepper
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

interface IdentityMetadataInTx {
  address: string
  e164Number: string
  salt: string
  phoneHash?: string
}

// Check tx comments (if they exist) for identity metadata like phone numbers and salts
export function* checkTxsForIdentityMetadata({ transactions }: NewTransactionsInFeedAction) {
  try {
    if (!transactions || !transactions.length) {
      return
    }
    Logger.debug(TAG + 'checkTxsForIdentityMetadata', `Checking ${transactions.length} txs`)

    const dataEncryptionKey: string | null = yield select(dataEncryptionKeySelector)
    if (!dataEncryptionKey) {
      Logger.error(TAG + 'checkTxsForIdentityMetadata', 'Missing DEK, should never happen.')
      return
    }

    const newIdentityData = findIdentityMetadataInComments(transactions, dataEncryptionKey)

    const verifiedMetadata: IdentityMetadataInTx[] = yield call(
      verifyIdentityMetadata,
      newIdentityData
    )
    yield call(updatePhoneNumberMappings, verifiedMetadata)
    Logger.debug(TAG + 'checkTxsForIdentityMetadata', 'Done checking txs')
  } catch (error) {
    Logger.error(TAG + 'checkTxsForIdentityMetadata', 'Error checking metadata', error)
    // Allowing error to be swallowed for now. Impact is just that tx may not be labelled with full contact info
  }
}

// Check all transaction comments for metadata
function findIdentityMetadataInComments(
  transactions: TransactionFeedFragment[],
  dataEncryptionKey: string
) {
  const newIdentityData: IdentityMetadataInTx[] = []
  for (const tx of transactions) {
    if (tx.__typename !== 'TokenTransfer' || tx.type !== TokenTransactionType.Received) {
      continue
    }
    const { e164Number, salt } = decryptComment(tx.comment, dataEncryptionKey, false)
    if (!e164Number || !salt) {
      continue
    }
    Logger.debug(TAG + 'checkTxsForIdentityMetadata', `Found metadata in tx hash ${tx.hash}`)
    newIdentityData.push({
      address: tx.address,
      e164Number,
      salt,
    })
  }
  return newIdentityData
}

// Verify the metadata claims (they could be spoofed)
// Returns set of metadata objects with invalid ones filtered out
function* verifyIdentityMetadata(data: IdentityMetadataInTx[]) {
  // This function looks a bit convoluted because:
  // 1. Data could have dupes in it
  // 2. Some duped phone hashes could be true, others false
  // 3. And a given phoneHash could legitimately have multiple addresses

  if (!data || !data.length) {
    return []
  }

  const phoneHashes = new Set<string>()
  data.map((d) => {
    const phoneHash = getPhoneHash(d.e164Number, d.salt)
    phoneHashes.add(phoneHash)
    d.phoneHash = phoneHash
  })

  const lookupResult: IdentifierLookupResult = yield call(
    lookupAttestationIdentifiers,
    Array.from(phoneHashes)
  )

  return data.filter((d) => {
    const onChainAddresses = getAddressesFromLookupResult(lookupResult, d.phoneHash!)
    if (!onChainAddresses || !onChainAddresses.length) {
      Logger.warn(
        TAG + 'verifyIdentityMetadata',
        `Phone number and/or salt claimed by address ${d.address} is not verified. Values are incorrect or sender is impersonating another number`
      )
      return false
    }

    if (!onChainAddresses.find((a) => eqAddress(a, d.address))) {
      Logger.warn(
        TAG + 'verifyIdentityMetadata',
        `Phone number and/or salt claimed by address ${d.address} does not match any on-chain addresses. Values are incorrect or sender is impersonating another number`
      )
      return false
    }

    return true
  })
}

// Dispatch updates to store with the new information
function* updatePhoneNumberMappings(newIdentityData: IdentityMetadataInTx[]) {
  if (!newIdentityData || !newIdentityData.length) {
    return
  }

  const e164NumberToSalt: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const e164NumberToAddress: E164NumberToAddressType = yield select(e164NumberToAddressSelector)

  const e164NumberToAddressUpdates: E164NumberToAddressType = {}
  const addressToE164NumberUpdates: AddressToE164NumberType = {}
  const e164NumberToSaltUpdates: E164NumberToSaltType = {}

  for (const data of newIdentityData) {
    const { address, e164Number, salt } = data

    // Verify salt is correct
    const existingSalt = e164NumberToSalt[e164Number]
    if (existingSalt && salt !== existingSalt) {
      Logger.warn(
        TAG + 'updatePhoneNumberMappings',
        `Salt claimed by address ${address} does not match cached salt. This should never happen. Sender may be attempting to impersonate another number`
      )
      continue
    }
    e164NumberToSaltUpdates[e164Number] = salt

    // Merge new address in with old ones, create set to avoid duplicates
    const addressSet = new Set<string>(e164NumberToAddress[e164Number])
    addressSet.add(address)
    e164NumberToAddressUpdates[e164Number] = Array.from(addressSet)
    addressToE164NumberUpdates[address] = e164Number
  }

  yield put(updateE164PhoneNumberSalts(e164NumberToSaltUpdates))
  yield put(updateE164PhoneNumberAddresses(e164NumberToAddressUpdates, addressToE164NumberUpdates))
}
