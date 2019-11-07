import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'

import { Address, CeloContract } from '../base'
import { ContractKit } from '../kit'
import { CeloTransactionObject, NumberLike, toBuffer } from './BaseWrapper'
import { encodedTransactions, Transaction } from './Governance'

export interface JSONTransaction {
  value: NumberLike
  celoContractName: CeloContract
  methodName: string
  args: any[]
}

type Web3Method = Contract['methods'][keyof Contract['methods']]
export class TransactionBuilder {
  public transactions: Transaction[]
  private kit: ContractKit

  constructor(_kit: ContractKit, _transactions: Transaction[] = []) {
    this.transactions = _transactions
    this.kit = _kit
  }

  get hash(): Buffer {
    const encoded = encodedTransactions(this.transactions)
    return keccak256(
      this.kit.web3.eth.abi.encodeParameters(
        ['uint256[]', 'address[]', 'bytes', 'uint256[]'],
        [encoded.values, encoded.destinations, encoded.data, encoded.dataLengths]
      )
    ) as Buffer
  }

  appendCeloTx(tx: CeloTransactionObject<any>) {
    if (tx.defaultParams === undefined) {
      throw new Error('Default params not defined on CeloTransactionObject')
    } else if (tx.defaultParams.to === undefined) {
      throw new Error('Destination not defined on CeloTransactionObject')
    } else if (tx.defaultParams.value === undefined) {
      throw new Error('Value not defined on CeloTransactionObject')
    }

    this.transactions.push({
      value: tx.defaultParams.value,
      destination: tx.defaultParams.to,
      data: toBuffer(tx.txo.encodeABI()),
    })
  }

  appendWeb3Tx<M extends Web3Method>(
    value: NumberLike,
    destination: Address,
    method: M,
    args: Parameters<M>
  ) {
    this.transactions.push({
      value,
      destination,
      data: this.toTransactionData(method, args),
    })
  }

  appendCeloJsonTx(jsonTx: JSONTransaction) {
    this.kit._web3Contracts.getContract(jsonTx.celoContractName).then(
      (contract) => {
        const method = (contract.methods as Contract['methods'])[jsonTx.methodName]
        if (method === undefined) {
          throw new Error(`Method ${jsonTx.methodName} not found on ${jsonTx.celoContractName}`)
        }
        this.transactions.push({
          value: jsonTx.value,
          destination: contract._address,
          data: this.toTransactionData(method, jsonTx.args),
        })
      },
      () => {
        throw new Error(`Contract ${jsonTx.celoContractName} not found`)
      }
    )
  }

  private toTransactionData<M extends Web3Method>(contractMethod: M, args: Parameters<M>) {
    return toBuffer(contractMethod(...args).encodeABI())
  }

  static fromCeloTransactions(kit: ContractKit, transactions: Array<CeloTransactionObject<any>>) {
    const txBuilder = new TransactionBuilder(kit)
    transactions.map((tx) => txBuilder.appendCeloTx(tx))
    return txBuilder.transactions
  }

  static fromCeloJsonTransactions(kit: ContractKit, transactions: JSONTransaction[]) {
    const txBuilder = new TransactionBuilder(kit)
    transactions.map((tx) => txBuilder.appendCeloJsonTx(tx))
    return txBuilder.transactions
  }
}
