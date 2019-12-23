import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { hexToBuffer } from '@celo/utils/src/address'
import { encryptComment as encryptCommentRaw } from '@celo/utils/src/commentEncryption'
import { contractKit } from 'src/web3/contracts'

export async function getCommentKey(address: string): Promise<Buffer | null> {
  const accountsWrapper: AccountsWrapper = await contractKit.contracts.getAccounts()
  // getDataEncryptionKey actually returns a string instead of an array
  const hexString = [await accountsWrapper.getDataEncryptionKey(address)].join()
  // No comment key -> empty string returned from getDEK. This is expected for old addresses created before comment encryption change
  return !hexString ? null : hexToBuffer(hexString)
}

export async function encryptComment(
  comment: string,
  toAddress: string | null | undefined,
  fromAddress: string | null | undefined
): Promise<string> {
  // Don't encrypt empty comments
  if (comment === '') {
    return comment
  }
  // Must have addresses to lookup CEK
  if (toAddress && fromAddress) {
    const toKey = await getCommentKey(toAddress)
    const fromKey = await getCommentKey(fromAddress)
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
