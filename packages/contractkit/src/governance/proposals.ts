import { BigNumber } from 'bignumber.js'
import { keccak256 } from 'ethereumjs-util'
import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import { TransactionObject, Tx } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'

import { CeloContract } from '../base'
import { ContractKit } from '../kit'
import { CeloTransactionObject, toBuffer } from '../wrappers/BaseWrapper'
import { Proposal } from '../wrappers/Governance'

export interface CeloProposalTransactionJSON {
  value: string
  celoContractName: CeloContract
  methodName: string
  args: string[]
}

type TxParams = Pick<Tx, 'to' | 'value'>

export interface ParameterizedTXO {
  txo: TransactionObject<any>
  params: Required<TxParams>
}

export class PTXOFactory {
  static async fromCeloJsonTxAndKit(
    jsonTx: CeloProposalTransactionJSON,
    kit: ContractKit
  ): Promise<ParameterizedTXO> {
    const contract = await kit._web3Contracts.getContract(jsonTx.celoContractName)
    const method = (contract.methods as Contract['methods'])[jsonTx.methodName]
    if (!method) {
      throw new Error(`Method ${jsonTx.methodName} not found on ${jsonTx.celoContractName}`)
    }
    const txo = method(jsonTx.args)
    if (!txo) {
      throw new Error(`Method ${jsonTx.methodName} did not match arguments ${jsonTx.args}`)
    }
    return {
      txo,
      params: { to: contract._address, value: jsonTx.value },
    }
  }

  static fromCeloTx(tx: CeloTransactionObject<any>, params: TxParams = {}): ParameterizedTXO {
    const to = tx.defaultParams ? tx.defaultParams.to : params.to
    const value = tx.defaultParams ? tx.defaultParams.value : params.value
    if (to && value) {
      return {
        txo: tx.txo,
        params: { to, value },
      }
    } else {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
  }
}

export class PTXOProposal extends Proposal {
  public constructor(private readonly paramTXOs: ParameterizedTXO[]) {
    super(
      paramTXOs.map((ptxo) => ({
        value: new BigNumber(ptxo.params.value),
        destination: ptxo.params.to,
        data: toBuffer(ptxo.txo.encodeABI())
      }))
    )
  }

  private static paramTypes = ['']
  get paramsEncoded() {
    const encoder = new Web3().eth.abi.encodeParameters
    return encoder(PTXOProposal.paramTypes, this.params)
  }

  get hash(): Buffer {
    return keccak256(this.paramsEncoded) as Buffer
  }

  async celoJsonWithKit(kit: ContractKit): Promise<CeloProposalTransactionJSON[]> {
    const addresses = await kit.registry.allAddresses()
    const names = Object.keys(CeloContract) as CeloContract[]
    const addressToNameMap = new Map(names.map((name) => [addresses[name], name]))

    return concurrentMap(1, this.paramTXOs, async (ptxo) => {
      const contract = addressToNameMap.get(ptxo.params.to)
      if (!contract) {
        throw new Error(`Transaction destination ${ptxo.params.to} not found in registry`)
      }
      const encodedTx = ptxo.txo.encodeABI()
      console.log("encodedTx", encodedTx)

      return {
        value: ptxo.params.value.toString(),
        celoContractName: contract,
        methodName: 'PLACEHOLDER_METHOD_NAME',
        args: ptxo.txo.arguments.map(toString),
      }
    })
  }
}
