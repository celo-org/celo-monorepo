import { encryptComment as encryptCommentRaw } from '@celo/utils/src/commentEncryption'
import { stripHexLeader } from '@celo/utils/src/signatureUtils'
import { getAttestationsContract, getDataEncryptionKey } from '@celo/walletkit'
import { web3 } from 'src/web3/contracts'

export async function getCommentKey(address: string): Promise<Buffer | null> {
  const attestations = await getAttestationsContract(web3)
  const hexString = await getDataEncryptionKey(attestations, address)
  // No comment key -> empty string returned from getDEK. This is expected for old addresses created before comment encryption change
  if (!hexString) {
    return null
  }
  // Buffer.from will create an empty buffer if the input string has '0x' prepended
  return Buffer.from(stripHexLeader(hexString), 'hex')
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
