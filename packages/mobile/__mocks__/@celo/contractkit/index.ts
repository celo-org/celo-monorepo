import BigNumber from 'bignumber.js'

const txo = {
  send: jest.fn(),
  sendAndWaitForReceipt: jest.fn(),
}

export const newKitFromWeb3 = () => ({
  contracts: {
    getGasPriceMinimum: async () => ({
      getGasPriceMinimum: jest.fn(async (address: string) => new BigNumber(10000)),
    }),
    getStableToken: jest.fn(async () => ({
      balanceOf: jest.fn(async () => {
        return new BigNumber(10000000000)
      }),
      decimals: jest.fn(async () => '10'),
      transferWithComment: jest.fn(async () => ({ txo })),
    })),
    getGoldToken: async () => ({
      balanceOf: jest.fn(async () => new BigNumber(10000000000)),
      decimals: jest.fn(async () => '10'),
      transferWithComment: jest.fn(async () => ({ txo })),
    }),
  },
  registry: {
    addressFor: async (address: string) => 1000,
  },
})

export enum CeloContract {
  Accounts = 'Accounts',
  Attestations = 'Attestations',
  BlockchainParameters = 'BlockchainParameters',
  DoubleSigningSlasher = 'DoubleSigningSlasher',
  DowntimeSlasher = 'DowntimeSlasher',
  Election = 'Election',
  EpochRewards = 'EpochRewards',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  FeeCurrencyWhitelist = 'FeeCurrencyWhitelist',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  LockedGold = 'LockedGold',
  Random = 'Random',
  Registry = 'Registry',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  Validators = 'Validators',
}
