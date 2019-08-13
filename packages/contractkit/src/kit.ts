import { AddressRegistry } from 'src/AddressRegistry'
import { Address, CeloToken } from 'src/base'
import { ContractCache } from 'src/contract-cache'
import { sendTransaction, TxOptions } from 'src/utils/send-tx'
import { toTxResult } from 'src/utils/tx-result'
import { WrapperCache } from 'src/wrapper-cache'
import Web3 from 'web3'
import { TransactionObject, Tx } from 'web3/eth/types'

export function newKit(url: string) {
  return newKitFromWeb3(new Web3(url))
}

export function newKitFromWeb3(web3: Web3) {
  return new ContractKit(web3)
}

export class ContractKit {
  readonly registry: AddressRegistry
  readonly contracts: ContractCache
  readonly wrappers: WrapperCache

  defaultOptions: TxOptions
  constructor(readonly web3: Web3) {
    this.defaultOptions = {
      gasInflationFactor: 1.3,
    }

    this.registry = new AddressRegistry(this)
    this.contracts = new ContractCache(this)
    this.wrappers = new WrapperCache(this)
  }

  async setGasCurrency(token: CeloToken) {
    this.defaultOptions.gasCurrency = await this.registry.addressFor(token)
  }

  set defaultAccount(address: Address) {
    this.web3.eth.defaultAccount = address
  }

  get defaultAccount() {
    return this.web3.eth.defaultAccount
  }

  setGasCurrencyAddress(address: Address) {
    this.defaultOptions.gasCurrency = address
  }

  sendTransaction(tx: Tx) {
    const promiEvent = this.web3.eth.sendTransaction({
      gasCurrency: this.defaultOptions.gasCurrency,
      gasBeneficiary: this.defaultOptions.gasBeneficiary,
      from: this.defaultOptions.from,
      ...tx,
    })
    return toTxResult(promiEvent)
  }

  sendTransactionObject(txObj: TransactionObject<any>, options?: TxOptions) {
    return sendTransaction(txObj, {
      ...this.defaultOptions,
      ...options,
    })
  }
}
