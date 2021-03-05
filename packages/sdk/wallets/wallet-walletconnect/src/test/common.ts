import { Address } from '@celo/base'
import { CeloTx } from '@celo/connect'
import { newKit } from '@celo/contractkit'
import { EIP712TypedData } from '@celo/utils/src/sign-typed-data-utils'
import { toChecksumAddress } from 'ethereumjs-util'

// personal_sign is the one RPC that has [payload, from] rather
// than [from, payload]
export function parsePersonalSign(req: any): { from: string; payload: string } {
  const [payload, from] = req.payload.params
  return { from, payload }
}
export function parseSignTypedData(req: any): { from: string; payload: EIP712TypedData } {
  const [from, payload] = req.payload.params
  return { from, payload: JSON.parse(payload) }
}
export function parseSignTransaction(req: any): CeloTx {
  return req.payload.params
}
export function parseComputeSharedSecret(req: any): { from: Address; publicKey: string } {
  const [from, publicKey] = req.payload.params
  return { from, publicKey }
}
export function parseDecrypt(req: any): { from: string; payload: Buffer } {
  const [from, payload] = req.payload.params
  return { from, payload: Buffer.from(payload, 'hex') }
}

const privateKey = '04f9d516be49bb44346ca040bdd2736d486bca868693c74d51d274ad92f61976'
const kit = newKit('https://alfajores-forno.celo-testnet.org')
kit.addAccount(privateKey)
const wallet = kit.getWallet()!
const [account] = wallet.getAccounts()

export const testWallet = wallet
export const testPrivateKey = privateKey
export const testAddress = toChecksumAddress(account)
