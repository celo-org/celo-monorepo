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
  // Catch-all: every implementation now compiles as 0.8, so no per-contract list is
  // maintained. Release tooling resolves each artifact by checking which build tree
  // actually contains it (0.5-first with a fallback), which also stays correct when
  // building old release tags.
  contracts: [] as string[],
  truffleConfig: 'truffle-config0.8.js',
  forgeOutDir: 'out-truffle-compat-0.8',
  destDir: 'contracts-0.8',
} satisfies ContractPackage
