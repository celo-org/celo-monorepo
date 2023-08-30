import { privateKeyToAddress } from '@celo/utils/lib/address'
import { serializeSignature, Signature, signMessage } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import {
  AuthenticationMethod,
  PhoneNumberPrivacyRequest,
  PnpQuotaRequest,
  SignMessageRequest,
} from '../interfaces'
import { signWithRawKey } from '../utils/authentication'
import { genSessionID } from '../utils/logger'

export interface AttestationsStatus {
  isVerified: boolean
  numAttestationsRemaining: number
  total: number
  completed: number
}

export function createMockAttestation(getVerifiedStatus: jest.Mock<AttestationsStatus, []>) {
  return {
    getVerifiedStatus,
  }
}

export function createMockToken(balanceOf: jest.Mock<BigNumber, []>) {
  return {
    balanceOf,
  }
}

export function createMockAccounts(
  getWalletAddress: jest.Mock<string, []>,
  getDataEncryptionKey: jest.Mock<string, []>
) {
  return {
    getWalletAddress,
    getDataEncryptionKey,
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
    connection: mockWeb3 ?? createMockConnection(mockWeb3),
  }
}

export function createMockConnection(mockWeb3: any) {
  return {
    web3: mockWeb3,
    getTransactionCount: jest.fn(() => mockWeb3.eth.getTransactionCount()),
    getBlockNumber: jest.fn(() => {
      return mockWeb3.eth.getBlockNumber()
    }),
  }
}

export enum ContractRetrieval {
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

export function getPnpQuotaRequest(
  account: string,
  authenticationMethod?: string
): PnpQuotaRequest {
  return {
    account,
    authenticationMethod,
    sessionID: genSessionID(),
  }
}

export function getPnpSignRequest(
  account: string,
  blindedQueryPhoneNumber: string,
  authenticationMethod?: string
): SignMessageRequest {
  return {
    account,
    blindedQueryPhoneNumber,
    authenticationMethod,
    sessionID: genSessionID(),
  }
}

export function getPnpRequestAuthorization(req: PhoneNumberPrivacyRequest, pk: string) {
  const msg = JSON.stringify(req)
  if (req.authenticationMethod === AuthenticationMethod.ENCRYPTION_KEY) {
    return signWithRawKey(JSON.stringify(req), pk)
  }
  const account = privateKeyToAddress(pk)
  return serializeSignature(signMessage(msg, pk, account))
}
