import Web3 from 'web3'

const web3 = new Web3()

export function createMockAttestation(completed: number, total: number) {
  return {
    getAttestationStat: jest.fn().mockReturnValue({ completed, total }),
  }
}

export function createMockContractKit(c: { [contractName in ContractRetrieval]: any }) {
  const contracts: any = {}
  for (const t of Object.keys(c)) {
    contracts[t] = jest.fn().mockReturnValue(c[t as ContractRetrieval])
  }

  return {
    contracts,
    registry: {
      addressFor: async () => 1000,
    },
    web3,
  }
}

export enum ContractRetrieval {
  getAttestations = 'getAttestations',
}
