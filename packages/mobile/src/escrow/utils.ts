import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { generateDeterministicInviteCode } from '@celo/utils/lib/account'

export const splitSignature = (contractKit: ContractKit, signature: string) => {
  const sig = trimLeading0x(signature)
  const r = `0x${sig.slice(0, 64)}`
  const s = `0x${sig.slice(64, 128)}`
  const v = contractKit.web3.utils.hexToNumber(ensureLeading0x(sig.slice(128, 130)))
  return { r, s, v }
}

export const generateEscrowPaymentId = (
  recipientPepper: string,
  addressIndex: number = 0,
  changeIndex: number = 0,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
) => {
  generateDeterministicInviteCode(pepper, addressIndex)
}
