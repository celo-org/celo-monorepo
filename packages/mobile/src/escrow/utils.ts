import { ensureLeading0x } from '@celo/base'
import { generateDeterministicInviteCode } from '@celo/utils/lib/account'
import { publicKeyToAddress } from '@celo/utils/lib/address'

export const generateEscrowPaymentIdAndPk = (
  recipientPhoneHash: string,
  recipientPepper: string,
  addressIndex: number = 0
) => {
  const { publicKey, privateKey } = generateDeterministicInviteCode(
    recipientPhoneHash,
    recipientPepper,
    addressIndex
  )
  return { paymentId: publicKeyToAddress(publicKey), privateKey: ensureLeading0x(privateKey) }
}

export const generateUniquePaymentId = (
  existingPaymentIds: string[],
  phoneHash: string,
  pepper: string
) => {
  const paymentIdSet: Set<string> = new Set(existingPaymentIds)

  // Using an upper bound of 100 to be sure this doesn't run forever given
  // the realistic amount of pending escrow txs is far less than this
  for (let i = 0; i < 100; i += 1) {
    const { paymentId } = generateEscrowPaymentIdAndPk(phoneHash, pepper, i)
    if (!paymentIdSet.has(paymentId)) {
      return paymentId
    }
  }
}
