import BigNumber from 'bignumber.js'
import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'
import { TransactionObject, Tx } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'

import { CeloContract } from '../base'
import { ContractKit } from '../kit'
import { bufferToString, CeloTransactionObject, stringToBuffer } from '../wrappers/BaseWrapper'
import { Proposal, ProposalTransaction } from '../wrappers/Governance'

export interface CeloProposalTransactionJSON {
  value: string
  celoContractName: CeloContract
  methodName: string
  args: Array<string | number>
}

export class ProposalUtility extends Proposal {
  constructor(transactions: ProposalTransaction[], private readonly kit: ContractKit) {
    super(transactions)
  }

  get hash(): Buffer {
    const paramsEncoded = this.kit.web3.eth.abi.encodeParameters(
      ['uint256[]', 'address[]', 'bytes', 'uint256[]'],
      this.params
    )
    return keccak256(paramsEncoded) as Buffer
  }

  async json(): Promise<CeloProposalTransactionJSON[]> {
    const addresses = await this.kit.registry.allAddresses()
    const names = Object.keys(CeloContract) as CeloContract[]
    const addressToNameMap = new Map(names.map((name) => [addresses[name], name]))

    return concurrentMap(1, this.transactions, async (transaction) => {
      // lookup CeloContract name from transaction destination address
      const celoContractName = addressToNameMap.get(transaction.destination)
      if (!celoContractName) {
        throw new Error(`Transaction destination ${transaction.destination} not found in registry`)
      }

      // lookup CeloContractMethod name from transaction data
      const contract = await this.kit._web3Contracts.getContract(celoContractName)
      const selectors = Object.keys(contract.methods)
      const funcSelector = bufferToString(transaction.data.slice(0, 4)) // func sig is first 4 bytes
      const idx = selectors.findIndex((selector) => selector === funcSelector)
      if (idx === -1) {
        throw new Error(`No method matching ${transaction} found on ${celoContractName}`)
      }
      const methodName = selectors[idx + 1] // pretty name 1 index after

      // lookup CeloContractMethod args from CeloContractMethod types and transaction data
      const methodParamTypes = methodName.slice(methodName.indexOf('(') + 1, -1).split(',')
      const encodedParams = bufferToString(transaction.data.slice(4))
      const paramObject = this.kit.web3.eth.abi.decodeParameters(methodParamTypes, encodedParams)
      const args = Array.from(Array(methodParamTypes.length).keys()).map((i) => paramObject[i])

      return {
        value: transaction.value.toFixed(),
        celoContractName,
        methodName,
        args,
      }
    })
  }
}

type TxParams = Pick<Tx, 'to' | 'value'>
export class ProposalTransactionFactory {
  static fromWeb3Txo(tx: TransactionObject<any>, params: Required<TxParams>): ProposalTransaction {
    return {
      value: new BigNumber(params.value),
      destination: params.to,
      data: stringToBuffer(tx.encodeABI()),
    }
  }

  static fromCeloTxo(tx: CeloTransactionObject<any>, params: TxParams = {}): ProposalTransaction {
    const to = tx.defaultParams ? tx.defaultParams.to : params.to
    const value = tx.defaultParams ? tx.defaultParams.value : params.value
    if (!to || !value) {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
    return this.fromWeb3Txo(tx.txo, { to, value })
  }

  static async fromCeloJsonTxAndKit(
    jsonTx: CeloProposalTransactionJSON,
    kit: ContractKit
  ): Promise<ProposalTransaction> {
    const contract = await kit._web3Contracts.getContract(jsonTx.celoContractName)
    const method = (contract.methods as Contract['methods'])[jsonTx.methodName]
    if (!method) {
      throw new Error(`Method ${jsonTx.methodName} not found on ${jsonTx.celoContractName}`)
    }
    const txo = method(jsonTx.args)
    if (!txo) {
      throw new Error(`Method ${jsonTx.methodName} did not match arguments ${jsonTx.args}`)
    }
    return this.fromWeb3Txo(txo, { to: contract._address, value: jsonTx.value })
  }
}
