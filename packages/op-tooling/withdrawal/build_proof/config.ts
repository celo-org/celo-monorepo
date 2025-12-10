import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia, mainnet, celo, celoSepolia } from 'viem/chains'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'
import { PRIVATE_KEY, NETWORK } from './env.ts'

export const account = privateKeyToAccount(`0x${PRIVATE_KEY}`)

let l1: { public?: any; wallet?: any } = {}
 if (NETWORK === 'sepolia') {
  l1.public = createPublicClient({
    chain: sepolia,
    transport: http(),
  }).extend(publicActionsL1())

  l1.wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  }).extend(walletActionsL1())
} else if (NETWORK === 'mainnet') {
  l1.public = createPublicClient({
    chain: mainnet,
    transport: http(),
  }).extend(publicActionsL1())

  l1.wallet = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  }).extend(walletActionsL1())
} else {
  throw new Error('Unsupported network. Supported networks are: sepolia, mainnet')
}
export const publicClientL1 = l1.public
export const walletClientL1 = l1.wallet

let l2: { public?: any; wallet?: any } = {}
 if (NETWORK === 'sepolia') {
  l2.public = createPublicClient({
    chain: celoSepolia,
    transport: http(),
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: celoSepolia,
    transport: http(),
  }).extend(walletActionsL2())
} else if (NETWORK === 'mainnet') {
  l2.public = createPublicClient({
    chain: celo,
    transport: http(),
  }).extend(publicActionsL2())

  l2.wallet = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  }).extend(walletActionsL2())
} else {
  throw new Error('Unsupported network. Supported networks are: sepolia, mainnet')
}
export const publicClientL2 = l2.public
export const walletClientL2 = l2.wallet
