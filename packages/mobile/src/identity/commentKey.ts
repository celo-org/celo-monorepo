import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { hexToBuffer } from '@celo/utils/src/address'
import { encryptComment as encryptCommentRaw } from '@celo/utils/src/commentEncryption'
import { call } from 'redux-saga/effects'
import { getContractKit } from 'src/web3/contracts'

export function* getCommentKey(address: string) {
  const contractKit = yield call(getContractKit)
  const accountsWrapper: AccountsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAccounts,
  ])
  // getDataEncryptionKey actually returns a string instead of an array
  const hexString = [yield call(accountsWrapper.getDataEncryptionKey, address)].join()
  // No comment key -> empty string returned from getDEK. This is expected for old addresses created before comment encryption change
  return !hexString ? null : hexToBuffer(hexString)
}

export function* encryptComment(
  comment: string,
  toAddress: string | null | undefined,
  fromAddress: string | null | undefined
) {
  // Don't encrypt empty comments
  if (comment === '') {
    return comment
  }
  // Must have addresses to lookup CEK
  if (toAddress && fromAddress) {
    const toKey = yield call(getCommentKey, toAddress)
    const fromKey = yield call(getCommentKey, fromAddress)
    // If we don't have both comment keys set, store unencrypted comment
    if (!toKey || !fromKey) {
      return comment
    }
    // 33 bytes is min pubkey length.
    const minCommentKeyLength = 33
    if (toKey.length < minCommentKeyLength || fromKey.length < minCommentKeyLength) {
      return comment
    }
    const { comment: encryptedComment } = encryptCommentRaw(comment, toKey, fromKey)
    return encryptedComment
  }
  return comment
}
