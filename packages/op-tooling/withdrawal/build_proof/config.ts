import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'
import { celoSepolia } from './celo_sepolia.ts'
import { PRIVATE_KEY } from './env.ts'

export const account = privateKeyToAccount(`0x${PRIVATE_KEY}`)

export const publicClientL1 = createPublicClient({
  chain: sepolia,
  transport: http(),
}).extend(publicActionsL1())

export const walletClientL1 = createWalletClient({
  account,
  chain: sepolia,
  transport: http(),
}).extend(walletActionsL1())

export const publicClientL2 = createPublicClient({
  chain: celoSepolia,
  transport: http(),
}).extend(publicActionsL2())

export const walletClientL2 = createWalletClient({
  account,
  chain: celoSepolia,
  transport: http(),
}).extend(walletActionsL2())
