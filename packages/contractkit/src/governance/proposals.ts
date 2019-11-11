import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'
import { TransactionObject, Tx } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'

import { CeloContract } from '../base'
import { ContractKit } from '../kit'
import { CeloTransactionObject, parseBuffer, toBuffer } from '../wrappers/BaseWrapper'
import { Proposal } from '../wrappers/Governance'

const debug = debugFactory('kit:proposals')

export interface CeloProposalTransactionJSON {
  value: string
  celoContractName: CeloContract
  methodName: string
  args: string[]
}

type TxParams = Pick<Tx, 'to' | 'value'>

interface ParameterizedTXO {
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

  static fromCeloTxo(tx: CeloTransactionObject<any>, params: TxParams = {}): ParameterizedTXO {
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

const toData = (ptxo: ParameterizedTXO) => toBuffer(ptxo.txo.encodeABI())

export class PTXOProposal extends Proposal {
  public constructor(
    private readonly paramTXOs: ParameterizedTXO[],
    private readonly kit: ContractKit
  ) {
    super(
      paramTXOs.map((ptxo) => ({
        value: new BigNumber(ptxo.params.value),
        destination: ptxo.params.to,
        data: toData(ptxo),
      }))
    )
  }

  get paramsEncoded() {
    // TODO(yorke): consider fetching params signature from ABI
    return this.kit.web3.eth.abi.encodeParameters(
      ['uint256[]', 'address[]', 'bytes', 'uint256[]'],
      this.params
    )
  }

  get hash(): Buffer {
    return keccak256(this.paramsEncoded) as Buffer
  }

  // TODO(yorke): investigate celoJsonWithKit from ProposalTransaction[]
  async json(): Promise<CeloProposalTransactionJSON[]> {
    const addresses = await this.kit.registry.allAddresses()
    const names = Object.keys(CeloContract) as CeloContract[]
    const addressToNameMap = new Map(names.map((name) => [addresses[name], name]))

    return concurrentMap(1, this.paramTXOs, async (ptxo) => {
      const contractName = addressToNameMap.get(ptxo.params.to)
      if (!contractName) {
        throw new Error(`Transaction destination ${ptxo.params.to} not found in registry`)
      }

      const contract = await this.kit._web3Contracts.getContract(contractName)
      const signatures = Object.keys(contract.methods)

      const funcSig = parseBuffer(toData(ptxo).slice(0, 4)) // func sig is first 4 bytes
      const idx = signatures.findIndex((sig) => sig === funcSig)
      if (idx === -1) {
        throw new Error(`No method matching ${ptxo.txo} found on ${contractName}`)
      }
      const methodName = signatures[idx + 1] // pretty name 1 index after selector

      return {
        value: ptxo.params.value.toString(),
        celoContractName: contractName,
        methodName,
        args: ptxo.txo.arguments,
      }
    })
  }
}
