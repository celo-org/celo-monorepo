import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { ContractKit } from '@celo/contractkit'

export const splitSignature = (contractKit: ContractKit, signature: string) => {
  const sig = trimLeading0x(signature)
  const r = `0x${sig.slice(0, 64)}`
  const s = `0x${sig.slice(64, 128)}`
  const v = contractKit.web3.utils.hexToNumber(ensureLeading0x(sig.slice(128, 130)))
  return { r, s, v }
}
