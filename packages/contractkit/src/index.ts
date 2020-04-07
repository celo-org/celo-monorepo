import Web3 from 'web3'

export { Address, AllContracts, CeloContract, CeloToken, NULL_ADDRESS } from './base'
export { IdentityMetadataWrapper } from './identity'
export * from './kit'
export { GenesisBlockUtils } from './network-utils/genesis-block-utils'
export { StaticNodeUtils } from './network-utils/static-node-utils'
export { CeloProvider } from './providers/celo-provider'
export { CeloTransactionObject, CeloTransactionParams } from './wrappers/BaseWrapper'

/**
 * Creates a new web3 instance
 * @param url node url
 */
export function newWeb3(url: string) {
  return new Web3(url)
}
