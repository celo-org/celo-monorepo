import { newKitFromWeb3 } from '@celo/contractkit'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'

export function* getContractKit() {
  return newKitFromWeb3(new Web3())
}

export async function getContractKitAsync() {
  return newKitFromWeb3(new Web3())
}

export function* getConnectedWallet() {
  const mockGethWallet = {
    addAccount: jest.fn(async (privateKey: string, passphrase: string) =>
      privateKeyToAddress(privateKey)
    ),
    unlockAccount: jest.fn(),
    isAccountUnlocked: jest.fn(() => true),
  }
  return mockGethWallet
}
