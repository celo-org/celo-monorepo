import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'
import { Tx } from 'web3/eth/types'

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

type TxParams = Pick<Tx, 'to' | 'value'>
type Web3Method = Contract['methods'][keyof Contract['methods']]
export class TransactionBuilder {
  constructor(
    private readonly kit: ContractKit,
    public readonly transactions: Transaction[] = []
  ) {}
  get hash(): Buffer {
    const encoded = this.encoded
    return keccak256(
      this.kit.web3.eth.abi.encodeParameters(
        ['uint256[]', 'address[]', 'bytes', 'uint256[]'],
        [encoded.values, encoded.destinations, encoded.data, encoded.dataLengths]
      )
    ) as Buffer
  }

  get encoded() {
    return encodedTransactions(this.transactions)
  }

  async json(): Promise<JSONTransaction[]> {
    const addresses = await this.kit.registry.allAddresses()
    const names = Object.keys(CeloContract) as CeloContract[]
    const addressToNameMap = new Map(names.map((name) => [addresses[name], name]))

    return this.transactions.map((tx) => {
      const contract = addressToNameMap.get(tx.destination)
      if (contract === undefined) {
        throw new Error(`Transaction destination ${tx.destination} not found in registry`)
      }
      // TODO: figure out how to decode tx.data using web3contract
      // const web3contract = await this.kit._web3Contracts.getContract(contract)
      return {
        value: tx.value,
        celoContractName: contract,
        methodName: '',
        args: [],
      }
    })
  }

  appendCeloTx(tx: CeloTransactionObject<any>, params?: TxParams) {
    const mergedParams: TxParams = { ...tx.defaultParams, ...params }
    if (mergedParams.to && mergedParams.value) {
      this.transactions.push({
        value: mergedParams.value,
        destination: mergedParams.to,
        data: toBuffer(tx.txo.encodeABI()),
      })
    } else {
      throw new Error("Parameters 'to' and/or 'value' not provided")
    }
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
