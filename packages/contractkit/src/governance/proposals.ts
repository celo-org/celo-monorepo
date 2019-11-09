import { BigNumber } from 'bignumber.js'
import { keccak256 } from 'ethereumjs-util'
import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import { TransactionObject, Tx } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'

import { CeloContract } from '../base'
import { ContractKit } from '../kit'
import {
  CeloTransactionObject,
  identity,
  parseBytes,
  parseNumber,
  toBuffer,
} from '../wrappers/BaseWrapper'
import { ProposalEncoded, ProposalTransaction } from '../wrappers/Governance'

export interface CeloProposalTransactionJSON {
  value: string
  celoContractName: CeloContract
  methodName: string
  args: string[]
}

export class ProposalFactory {
  static from(txs: ProposalTransaction[]): Proposal {
    return new Proposal(txs)
  }

  static async fromAsync(txs: Array<Promise<ProposalTransaction>>, concurrency = 1) {
    return this.from(await concurrentMap(concurrency, txs, identity))
  }
}

export class Proposal extends Array<ProposalTransaction> {
  public constructor(txs: ProposalTransaction[]) {
    if (txs.length === 0) {
      throw new Error(`No transactions provided`)
    }
    super(...txs)
  }

  get hash(): Buffer {
    const solEncoder = new Web3().eth.abi.encodeParameters
    const solEncoded = solEncoder(['uint256[]', 'address[]', 'bytes', 'uint256[]'], this.encoded)
    return keccak256(solEncoded) as Buffer
  }

  get encoded(): ProposalEncoded {
    return [
      this.map((tx) => parseNumber(tx.value)),
      this.map((tx) => tx.destination),
      parseBytes(Buffer.concat(this.map((tx) => tx.data))),
      this.map((tx) => tx.data.length),
    ]
  }

  async celoJsonWithKit(kit: ContractKit) {
    const addresses = await kit.registry.allAddresses()
    const names = Object.keys(CeloContract) as CeloContract[]
    const addressToNameMap = new Map(names.map((name) => [addresses[name], name]))

    return this.map(
      (tx): CeloProposalTransactionJSON => {
        const contract = addressToNameMap.get(tx.destination)
        if (contract === undefined) {
          throw new Error(`Transaction destination ${tx.destination} not found in registry`)
        }
        return {
          value: parseNumber(tx.value),
          celoContractName: contract,
          // TODO: figure out how to decode tx.data using web3contract to get method and args
          methodName: '',
          args: [],
        }
      }
    )
  }
}

type TxParams = Pick<Tx, 'to' | 'value'>
export class ProposalTransactionFactory {
  static async fromCeloJsonTxAndKit(jsonTx: CeloProposalTransactionJSON, kit: ContractKit) {
    const contract = await kit._web3Contracts.getContract(jsonTx.celoContractName)
    const method = (contract.methods as Contract['methods'])[jsonTx.methodName]
    if (contract === undefined || method === undefined) {
      throw new Error(`Method ${jsonTx.methodName} not found on ${jsonTx.celoContractName}`)
    }
    const txo = method(jsonTx.args)
    if (txo === undefined) {
      throw new Error(`Method ${jsonTx.methodName} did not match arguments ${jsonTx.args}`)
    }
    return this.fromWeb3Tx(txo, { to: contract._address, value: jsonTx.value })
  }

  static fromCeloTx(tx: CeloTransactionObject<any>, params?: TxParams) {
    const mergedParams: TxParams = { ...tx.defaultParams, ...params }
    if (mergedParams.to && mergedParams.value) {
      return this.fromWeb3Tx(tx.txo, mergedParams as Required<TxParams>)
    } else {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
  }

  static fromWeb3Tx(tx: TransactionObject<any>, params: Required<TxParams>): ProposalTransaction {
    return {
      value: new BigNumber(params.value),
      destination: params.to,
      data: toBuffer(tx.encodeABI()),
    }
  }
}
