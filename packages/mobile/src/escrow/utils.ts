import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { generateDeterministicInviteCode } from '@celo/utils/lib/account'
import { publicKeyToAddress } from '@celo/utils/lib/address'

export const splitSignature = (contractKit: ContractKit, signature: string) => {
  const sig = trimLeading0x(signature)
  const r = `0x${sig.slice(0, 64)}`
  const s = `0x${sig.slice(64, 128)}`
  const v = contractKit.web3.utils.hexToNumber(ensureLeading0x(sig.slice(128, 130)))
  return { r, s, v }
}

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
  const paymentIdSet: Set<string> = new Set()
  for (const paymentId of existingPaymentIds) {
    paymentIdSet.add(paymentId)
  }

  // Using an upper bound of 1000 to be sure this doesn't run forever given
  // the realistic amount of pending escrow txs is far less than this
  for (let i = 0; i < 1000; i += 1) {
    const { paymentId } = generateEscrowPaymentIdAndPk(phoneHash, pepper, i)
    if (!paymentIdSet.has(paymentId)) {
      return paymentId
    }
  }
}
