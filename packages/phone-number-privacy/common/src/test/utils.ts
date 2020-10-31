import { Signature } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import * as threshold from 'blind-threshold-bls'
import btoa from 'btoa'
import Web3 from 'web3'

export function createMockAttestation(completed: number, total: number) {
  return {
    getVerifiedStatus: jest.fn(() => ({ completed, total })),
  }
}

export function createMockToken(balance: BigNumber) {
  return {
    balanceOf: jest.fn(() => balance),
  }
}

export function createMockAccounts(walletAddress: string) {
  return {
    getWalletAddress: jest.fn(() => walletAddress),
  }
}

export function createMockContractKit(
  c: { [contractName in ContractRetrieval]: any },
  mockWeb3?: any
) {
  const contracts: any = {}
  for (const t of Object.keys(c)) {
    contracts[t] = jest.fn(() => c[t as ContractRetrieval])
  }

  return {
    contracts,
    registry: {
      addressFor: async () => 1000,
    },
    web3: mockWeb3 ? mockWeb3 : new Web3(),
  }
}

export enum ContractRetrieval {
  getAttestations = 'getAttestations',
  getStableToken = 'getStableToken',
  getGoldToken = 'getGoldToken',
  getAccounts = 'getAccounts',
}

export function createMockWeb3(txCount: number) {
  return {
    eth: {
      getTransactionCount: jest.fn(() => txCount),
    },
  }
}

export function getBlindedPhoneNumber(phoneNumber: string, blindingFactor: Buffer): string {
  const blindedPhoneNumber = threshold.blind(Buffer.from(phoneNumber), blindingFactor).message
  return uint8ArrayToBase64(blindedPhoneNumber)
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function replenishQuota(account: string, contractKit: any) {
  const goldToken = await contractKit.contracts.getGoldToken()
  const selfTransferTx = goldToken.transfer(account, 1)
  await selfTransferTx.sendAndWaitForReceipt()
}

export async function registerWalletAddress(
  accountAddress: string,
  walletAddress: string,
  walletAddressPk: string,
  contractKit: any
) {
  const accounts = await contractKit.contracts.getAccounts()
  const pop = await accounts.generateProofOfKeyPossessionLocally(
    accountAddress,
    walletAddress,
    walletAddressPk
  )
  await accounts
    .setWalletAddress(walletAddress, pop as Signature)
    .sendAndWaitForReceipt({ from: accountAddress } as any)
}
