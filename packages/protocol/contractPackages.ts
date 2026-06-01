export interface ContractPackage {
  path?: string
  folderPath?: string
  name: string
  contracts: string[]
  contractsFolder?: string
  proxyContracts?: string[]
  truffleConfig?: string // TODO renaame to env config
  solidityVersion?: string
  proxiesPath?: string
  // Foundry artifact directory (relative to packages/protocol) where `forge build`
  // writes JSONs for this package, in the form `<forgeOutDir>/<Name>.sol/<Name>.json`.
  forgeOutDir?: string
  // Subfolder under the publishing build dir to write truffle-style flat artifacts to.
  destDir?: string
}

export const SOLIDITY_05_PACKAGE = {
  path: 'contracts',
  contractsFolder: '',
  folderPath: '',
  name: '0.5',
  contracts: [] as string[], // catch-all
  truffleConfig: 'truffle-config.js',
  forgeOutDir: 'out-truffle-compat',
  destDir: 'contracts',
} satisfies ContractPackage

export const SOLIDITY_08_PACKAGE = {
  path: 'contracts-0.8',
  contractsFolder: '',
  folderPath: '',
  name: '0.8',
  proxiesPath: '/', // Proxies are still with 0.5 contracts
  // Proxies shouldn't have to be added to a list manually
  // https://github.com/celo-org/celo-monorepo/issues/10555
  contracts: [
    'GasPriceMinimum',
    'FeeCurrencyDirectory',
    'CeloUnreleasedTreasury',
    'Validators',
    'EpochManager',
    'EpochManagerEnabler',
    'ScoreManager',
    'AddressLinkedList', // FIXME: https://github.com/celo-org/celo-monorepo/issues/11684
  ],
  proxyContracts: [
    'GasPriceMinimumProxy',
    'FeeCurrencyDirectoryProxy',
    'MentoFeeCurrencyAdapterV1',
    'CeloUnreleasedTreasuryProxy',
    'ValidatorsProxy',
    'EpochManagerProxy',
    'EpochManagerEnablerProxy',
    'ScoreManagerProxy',
  ],
  truffleConfig: 'truffle-config0.8.js',
  forgeOutDir: 'out-truffle-compat-0.8',
  destDir: 'contracts-0.8',
} satisfies ContractPackage
