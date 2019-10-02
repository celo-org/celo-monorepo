import Web3 from 'web3'

export { Address, AllContracts, CeloContract, CeloToken, NULL_ADDRESS } from './base'
export { IdentityMetadataWrapper } from './identity'
export * from './kit'
export { CeloTransactionObject } from './wrappers/BaseWrapper'
export { Roles } from './wrappers/LockedGold'

export function newWeb3(url: string) {
  return new Web3(url)
}
