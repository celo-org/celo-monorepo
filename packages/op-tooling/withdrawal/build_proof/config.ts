import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia, mainnet, celoSepolia } from 'viem/chains'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'
import { PRIVATE_KEY, NETWORK, L1_RPC_URL, L2_RPC_URL } from './env.ts'
import { celo } from './celo.ts'
import { chaos } from './chaos.ts'
import { havoc } from './havoc.ts'

export const account = privateKeyToAccount(`0x${PRIVATE_KEY}`)

const l1Transport = http(L1_RPC_URL)
const l2Transport = http(L2_RPC_URL)

let l1: { public: any; wallet: any } = {
  public: undefined,
  wallet: undefined,
}
// Chaos and Havoc settle on Sepolia, so they share the sepolia L1 clients.
const l1Chain = NETWORK === 'mainnet' ? mainnet : sepolia
if (NETWORK === 'mainnet' || NETWORK === 'sepolia' || NETWORK === 'chaos' || NETWORK === 'havoc') {
  l1.public = createPublicClient({
    chain: l1Chain,
    transport: l1Transport,
  }).extend(publicActionsL1())

  l1.wallet = createWalletClient({
    account,
    chain: l1Chain,
    transport: l1Transport,
  }).extend(walletActionsL1())
} else {
  throw new Error('Unsupported network. Supported networks are: mainnet, sepolia, chaos, havoc')
}
export const publicClientL1 = l1.public
export const walletClientL1 = l1.wallet

let l2: { public: any; wallet: any } = {
  public: undefined,
  wallet: undefined,
}
const l2Chain =
  NETWORK === 'mainnet'
    ? celo
    : NETWORK === 'chaos'
    ? chaos
    : NETWORK === 'havoc'
    ? havoc
    : celoSepolia
if (NETWORK === 'mainnet' || NETWORK === 'sepolia' || NETWORK === 'chaos' || NETWORK === 'havoc') {
  l2.public = createPublicClient({
    chain: l2Chain,
    transport: l2Transport,
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: l2Chain,
    transport: l2Transport,
  }).extend(walletActionsL2())
} else {
  throw new Error('Unsupported network. Supported networks are: mainnet, sepolia, chaos, havoc')
}
export const publicClientL2 = l2.public
export const walletClientL2 = l2.wallet
