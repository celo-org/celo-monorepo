import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, PublicClient, createWalletClient, WalletClient, http } from 'viem'
import { sepolia, holesky, celoAlfajores } from 'viem/chains'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'
import { celoBaklava } from './celo_baklava.ts'
import { celoSepolia } from './celo_sepolia.ts'
import { celoChaosV2 } from './celo_chaos_v2.ts'
import { PRIVATE_KEY, NETWORK } from './env.ts'

export const account = privateKeyToAccount(`0x${PRIVATE_KEY}`)

let l1: { public?: any; wallet?: any } = {}
if (NETWORK === 'alfajores' || NETWORK === 'baklava') {
  l1.public = createPublicClient({
    chain: holesky,
    transport: http(),
  }).extend(publicActionsL1())

  l1.wallet = createWalletClient({
    account,
    chain: holesky,
    transport: http(),
  }).extend(walletActionsL1())
} else if (NETWORK === 'sepolia' || NETWORK === 'chaos_v2') {
  l1.public = createPublicClient({
    chain: sepolia,
    transport: http(),
  }).extend(publicActionsL1())

  l1.wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  }).extend(walletActionsL1())
} else {
  throw new Error('Unsupported network. Supported networks are: alfajores, baklava, sepolia')
}
export const publicClientL1 = l1.public
export const walletClientL1 = l1.wallet

let l2: { public?: any; wallet?: any } = {}
if (NETWORK === 'alfajores') {
  l2.public = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: celoAlfajores,
    transport: http(),
  }).extend(walletActionsL2())
} else if (NETWORK === 'baklava') {
  l2.public = createPublicClient({
    chain: celoBaklava,
    transport: http(),
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: celoBaklava,
    transport: http(),
  }).extend(walletActionsL2())
} else if (NETWORK === 'sepolia') {
  l2.public = createPublicClient({
    chain: celoSepolia,
    transport: http(),
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: celoSepolia,
    transport: http(),
  }).extend(walletActionsL2())
} else if (NETWORK === 'chaos_v2') {
  l2.public = createPublicClient({
    chain: celoChaosV2,
    transport: http(),
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: celoChaosV2,
    transport: http(),
  }).extend(walletActionsL2())
} else {
  throw new Error('Unsupported network. Supported networks are: alfajores, baklava, sepolia, chaos_v2')
}
export const publicClientL2 = l2.public
export const walletClientL2 = l2.wallet
