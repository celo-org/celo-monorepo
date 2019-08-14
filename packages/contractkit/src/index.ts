import Web3 from 'web3'

export { Address, CeloContract, CeloToken, NULL_ADDRESS } from 'src/base'
export * from 'src/kit'

export function newWeb3(url: string) {
  return new Web3(url)
}
