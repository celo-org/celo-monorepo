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
  const hexString: string = yield call(accountsWrapper.getDataEncryptionKey, address)
  // No comment key -> empty string returned from getDEK. This is expected for old addresses created before comment encryption change
  return !hexString ? null : hexToBuffer(hexString)
}

export function* encryptComment(
  comment: string,
  toAddress: string,
  fromAddress: string,
  metadata?: string
) {
  if (!comment || !toAddress || !fromAddress) {
    return comment
  }

  const fromKey = yield call(getCommentKey, fromAddress)
  if (!fromKey) {
    return comment
  }

  const toKey = yield call(getCommentKey, toAddress)
  if (!toKey) {
    return comment
  }

  // 33 bytes is min pubkey length.
  //TODO move
  const minCommentKeyLength = 33
  if (toKey.length < minCommentKeyLength || fromKey.length < minCommentKeyLength) {
    return comment
  }
  const { comment: encryptedComment } = encryptCommentRaw(comment, toKey, fromKey)
  return encryptedComment
}
