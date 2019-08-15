import Web3 from 'web3'

export { Address, CeloContract, CeloToken, NULL_ADDRESS } from './base'
export * from './kit'

export function newWeb3(url: string) {
  return new Web3(url)
}
