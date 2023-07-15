export interface ContractPackage {
  path?: string
  name?: string
  contracts: string[]
  proxyContracts?: string[]
}

export const MENTO_PACKAGE: ContractPackage = {
  path: 'mento-core',
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
}
export const V_0_8_CONTRACTS: ContractPackage = {
  path: 'core-contracts-v0_8',
  name: 'v8',
  contracts: ['GasPriceMinimum'],
  proxyContracts: [],
}
