import { newKitFromWeb3 } from '@celo/contractkit'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'

export const initContractKit = jest.fn()
export const destroyContractKit = jest.fn()

export function* getContractKit() {
  return newKitFromWeb3(new Web3())
}

export async function getContractKitAsync() {
  return newKitFromWeb3(new Web3())
}

const mockGethWallet = {
  addAccount: jest.fn(async (privateKey: string, passphrase: string) =>
    privateKeyToAddress(privateKey)
  ),
  unlockAccount: jest.fn(),
  isAccountUnlocked: jest.fn(() => true),
}

export function* getWallet() {
  return mockGethWallet
}

export async function getWalletAsync() {
  return mockGethWallet
}

const web3 = new Web3()

export function* getWeb3() {
  return web3
}

export async function getWeb3Async() {
  return web3
}
