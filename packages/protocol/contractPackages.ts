export interface ContractPackage {
  path?: string
  folderPath?: string
  name?: string
  contracstFolder: string
  contracts: string[]
  proxyContracts?: string[]
  solidityVersion: string
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
  solidityVersion: '0.5',
}

export const SOLIDITY_08_PACKAGE: ContractPackage = {
  path: 'contracts-0.8',
  contracstFolder: '',
  folderPath: '',
  name: '0.8',
  contracts: [
    // TODO make this automatic?
    'GasPriceMinimum',
  ],
  proxyContracts: [
    // TODO make this automatic?
    'GasPriceMinimumProxy',
  ],
  solidityVersion: '0.8',
}

console.log('yeap, I got updated')
