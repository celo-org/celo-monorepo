import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'
import { Transaction, TransactionObject } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'

import { AllContracts, CeloContract } from '../base'
import { obtainKitContractDetails } from '../explorer/base'
import { BlockExplorer, CallDetails } from '../explorer/block-explorer'
import { ContractKit } from '../kit'
import { CeloTransactionObject, numberLikeToString } from '../wrappers/BaseWrapper'
import { Proposal, ProposalTransaction } from '../wrappers/Governance'

export interface ProposalTransactionJSON {
  callDetails: Pick<CallDetails, 'contract' | 'function' | 'args'>
  value: string
}

export class ProposalUtility extends Proposal {
  constructor(transactions: ProposalTransaction[], private readonly kit: ContractKit) {
    super(transactions)
  }

  static fromProposalAndKit(proposal: Proposal, kit: ContractKit) {
    return new ProposalUtility(proposal.transactions, kit)
  }

  get hash(): Buffer {
    const paramsEncoded = this.kit.web3.eth.abi.encodeParameters(
      ['uint256[]', 'address[]', 'bytes', 'uint256[]'],
      this.params
    )
    return keccak256(paramsEncoded) as Buffer
  }

  async json(): Promise<ProposalTransactionJSON[]> {
    const contractDetails = await obtainKitContractDetails(this.kit)
    const blockExplorer = new BlockExplorer(this.kit, contractDetails)

    return concurrentMap(1, this.transactions, async (transaction) => {
      const parsedTx = blockExplorer.tryParseTx(transaction as Transaction)
      if (parsedTx == null) {
        throw new Error(`Unable to parse ${transaction} with block explorer`)
      }
      return { callDetails: parsedTx.callDetails, value: parsedTx.tx.value }
    })
  }
}

type TxParams = Pick<ProposalTransaction, 'to' | 'value'>
export class ProposalTransactionFactory {
  static fromWeb3Txo(tx: TransactionObject<any>, params: Required<TxParams>): ProposalTransaction {
    return {
      value: params.value,
      to: params.to,
      input: tx.encodeABI(),
    }
  }

  static fromCeloTxo(tx: CeloTransactionObject<any>, params: Partial<TxParams> = {}) {
    const to = tx.defaultParams && tx.defaultParams.to ? tx.defaultParams.to : params.to
    const value = tx.defaultParams && tx.defaultParams.value ? tx.defaultParams.value : params.value
    if (!to || !value) {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
    return this.fromWeb3Txo(tx.txo, { to, value: numberLikeToString(value) })
  }

  static async fromJSONAndKit(tx: ProposalTransactionJSON, kit: ContractKit) {
    const contractName = tx.callDetails.contract as CeloContract
    if (!AllContracts.includes(contractName)) {
      throw new Error(`Contract ${contractName} not found`)
    }

    const contract = await kit._web3Contracts.getContract(contractName)
    const methodName = tx.callDetails.function
    const method = (contract.methods as Contract['methods'])[methodName]
    if (!method) {
      throw new Error(`Method ${methodName} not found on ${contractName}`)
    }
    const txo = method(tx.callDetails.args)
    if (!txo) {
      throw new Error(`Arguments ${tx.callDetails.args} did not match ${methodName} signature`)
    }
    return this.fromWeb3Txo(txo, { to: contract._address, value: tx.value })
  }
}
