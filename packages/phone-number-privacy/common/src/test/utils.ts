import { privateKeyToAddress } from '@celo/utils/lib/address'
import { serializeSignature, Signature, signMessage } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import * as threshold from 'blind-threshold-bls'
import btoa from 'btoa'
import Web3 from 'web3'
import { AuthenticationMethod, PhoneNumberPrivacyRequest, PnpQuotaRequest } from '../interfaces'
import { signWithRawDEK } from '../utils/authentication'
import { genSessionID } from '../utils/logger'

export function createMockAttestation(completed: number, total: number) {
  return {
    getVerifiedStatus: jest.fn(() => ({ completed, total })),
  }
}

export function createMockToken(balanceOf: jest.Mock<BigNumber, []>) {
  return {
    balanceOf,
  }
}

export function createMockAccounts(walletAddress: string, dataEncryptionKey?: string) {
  return {
    getWalletAddress: jest.fn(() => walletAddress),
    getDataEncryptionKey: jest.fn(() => dataEncryptionKey),
  }
}

// Take in jest.Mock to enable individual tests to spy on function calls
// and more easily set return values
export function createMockOdisPayments(totalPaidCUSDFunc: jest.Mock<BigNumber, []>) {
  return {
    totalPaidCUSD: totalPaidCUSDFunc,
  }
}

export function createMockContractKit(
  c: { [contractName in ContractRetrieval]?: any },
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
    connection: createMockConnection(mockWeb3),
  }
}

export function createMockConnection(mockWeb3?: any) {
  mockWeb3 = mockWeb3 ?? new Web3()
  return {
    web3: mockWeb3,
    getTransactionCount: jest.fn(() => mockWeb3.eth.getTransactionCount()),
    getBlockNumber: jest.fn(() => {
      return mockWeb3.eth.getBlockNumber()
    }),
  }
}

export enum ContractRetrieval {
  getAttestations = 'getAttestations',
  getStableToken = 'getStableToken',
  getGoldToken = 'getGoldToken',
  getAccounts = 'getAccounts',
  getOdisPayments = 'getOdisPayments',
}

export function createMockWeb3(txCount: number, blockNumber: number) {
  return {
    eth: {
      getTransactionCount: jest.fn(() => txCount),
      getBlockNumber: jest.fn(() => blockNumber),
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
  await selfTransferTx.sendAndWaitForReceipt({ from: account })
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

export function getPnpQuotaRequest(account: string, hashedPhoneNumber?: string): PnpQuotaRequest {
  return {
    account,
    hashedPhoneNumber,
    sessionID: genSessionID(),
  }
}

export function getPnpRequestAuthorization(req: PhoneNumberPrivacyRequest, pk: string) {
  const msg = JSON.stringify(req)
  if (req.authenticationMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    return signWithRawDEK(JSON.stringify(req), pk)
  }
  const account = privateKeyToAddress(pk)
  return serializeSignature(signMessage(msg, pk, account))
}
