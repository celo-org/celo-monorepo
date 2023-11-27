export interface ContractPackage {
  path?: string
  folderPath?: string
  name: string
  contracts: string[]
  contracstFolder?: string
  proxyContracts?: string[]
  truffleConfig?: string
  solidityVersion?: string
  proxiesPath?: string
}

export const MENTO_PACKAGE: ContractPackage = {
  path: 'mento-core',
  contracstFolder: 'contracts',
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
}

export const SOLIDITY_08_PACKAGE: ContractPackage = {
  path: 'contracts-0.8',
  contracstFolder: '',
  folderPath: '',
  name: '0.8',
  proxiesPath: '/', // Proxies are still with 0.5 contracts
  // Proxies shouldn't have to be added to a list manually
  // https://github.com/celo-org/celo-monorepo/issues/10555
  contracts: ['GasPriceMinimum'],
  proxyContracts: ['GasPriceMinimumProxy'],
  truffleConfig: 'truffle-config0.8.js',
}
