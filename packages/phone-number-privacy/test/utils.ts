import BigNumber from 'bignumber.js'
import Web3 from 'web3'

export function createMockAttestation(completed: number, total: number) {
  return {
    getAttestationStat: jest.fn(() => ({ completed, total })),
  }
}

export function createMockStableToken(balance: BigNumber) {
  return {
    balanceOf: jest.fn(() => balance),
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
}

export function createMockWeb3(txCount: number) {
  return {
    eth: {
      getTransactionCount: jest.fn(() => txCount),
    },
  }
}
