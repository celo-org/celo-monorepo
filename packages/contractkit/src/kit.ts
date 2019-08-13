import { AddressRegistry } from 'src/AddressRegistry'
import Web3 from 'web3'

export class ContractKit {
  readonly registry: AddressRegistry
  constructor(readonly web3: Web3) {
    this.registry = new AddressRegistry(this)
  }
}

export function newKit(url: string) {
  return newKitFromWeb3(new Web3(url))
}

export function newKitFromWeb3(web3: Web3) {
  return new ContractKit(web3)
}
