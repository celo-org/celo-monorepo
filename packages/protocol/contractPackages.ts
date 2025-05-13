export interface ContractPackage {
  path?: string
  folderPath?: string
  name: string
  contracts: string[]
  contractsFolder?: string
  proxyContracts?: string[]
  truffleConfig?: string
  solidityVersion?: string
  proxiesPath?: string
}

export const MENTO_PACKAGE = {
  path: 'mento-core',
  contractsFolder: 'contracts',
  folderPath: 'lib',
  name: 'mento',
  contracts: [
    'Exchange',
    'ExchangeEUR',
    'ExchangeBRL',
    'GrandaMento',
    'Reserve',
    'ReserveSpenderMultiSig',
    'StableToken',
    'StableTokenEUR',
    'StableTokenBRL',
  ],
  proxyContracts: [
    'ExchangeBRLProxy',
    'ExchangeEURProxy',
    'ExchangeProxy',
    'GrandaMentoProxy',
    'ReserveProxy',
    'ReserveSpenderMultiSigProxy',
    'StableTokenBRLProxy',
    'StableTokenEURProxy',
    'StableTokenProxy',
  ],
  truffleConfig: 'truffle-config.js',
} satisfies ContractPackage

export const SOLIDITY_08_PACKAGE = {
  path: 'contracts-0.8',
  contractsFolder: '',
  folderPath: '',
  name: '0.8',
  proxiesPath: '/', // Proxies are still with 0.5 contracts
  // Proxies shouldn't have to be added to a list manually
  // https://github.com/celo-org/celo-monorepo/issues/10555
  contracts: ['GasPriceMinimum', 'FeeCurrencyDirectory', 'MintGoldSchedule'],
  proxyContracts: [
    'GasPriceMinimumProxy',
    'FeeCurrencyDirectoryProxy',
    'MentoFeeCurrencyAdapterV1',
    'MintGoldScheduleProxy',
  ],
  truffleConfig: 'truffle-config0.8.js',
} satisfies ContractPackage
