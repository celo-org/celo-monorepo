import { concurrentMap } from '@celo/utils/lib/async'
import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'
import { Transaction, TransactionObject } from 'web3/eth/types'
import { AllContracts, CeloContract } from '../base'
import { obtainKitContractDetails } from '../explorer/base'
import { BlockExplorer } from '../explorer/block-explorer'
import { ContractKit } from '../kit'
import { CeloTransactionObject, valueToString } from '../wrappers/BaseWrapper'
import { GovernanceWrapper, Proposal, ProposalTransaction } from '../wrappers/Governance'

export interface ProposalTransactionJSON {
  contract: CeloContract
  function: string
  args: any[]
  value: string
}

export class ProposalUtility {
  constructor(private readonly kit: ContractKit, public readonly proposal: Proposal) {}

  get hash(): Buffer {
    const paramsEncoded = this.kit.web3.eth.abi.encodeParameters(
      ['uint256[]', 'address[]', 'bytes', 'uint256[]'],
      GovernanceWrapper.toParams(this.proposal)
    )
    return keccak256(paramsEncoded) as Buffer
  }

  async json(): Promise<ProposalTransactionJSON[]> {
    const contractDetails = await obtainKitContractDetails(this.kit)
    const blockExplorer = new BlockExplorer(this.kit, contractDetails)

    return concurrentMap(1, this.proposal, async (transaction) => {
      const parsedTx = blockExplorer.tryParseTx(transaction as Transaction)
      if (parsedTx == null) {
        throw new Error(`Unable to parse ${transaction} with block explorer`)
      }
      return {
        contract: parsedTx.callDetails.contract as CeloContract,
        function: parsedTx.callDetails.function,
        args: parsedTx.callDetails.args,
        value: parsedTx.tx.value,
      }
    })
  }
}

type ProposalTxParams = Pick<ProposalTransaction, 'to' | 'value'>
export class ProposalBuilder {
  constructor(private readonly kit: ContractKit, public readonly proposal: Proposal = []) {}

  addWeb3Tx(tx: TransactionObject<any>, params: Required<ProposalTxParams>) {
    this.proposal.push({
      value: params.value,
      to: params.to,
      input: tx.encodeABI(),
    })
  }

  addTx(tx: CeloTransactionObject<any>, params: Partial<ProposalTxParams> = {}) {
    const to = tx.defaultParams && tx.defaultParams.to ? tx.defaultParams.to : params.to
    const value = tx.defaultParams && tx.defaultParams.value ? tx.defaultParams.value : params.value
    if (!to || !value) {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
    this.addWeb3Tx(tx.txo, { to, value: valueToString(value) })
  }

  async addJsonTx(tx: ProposalTransactionJSON) {
    const contractName = tx.contract
    if (!AllContracts.includes(contractName)) {
      throw new Error(`Contract ${contractName} not found`)
    }

    const contract = await this.kit._web3Contracts.getContract(contractName)
    const methodName = tx.function
    const method = (contract.methods as Contract['methods'])[methodName]
    if (!method) {
      throw new Error(`Method ${methodName} not found on ${contractName}`)
    }
    const txo = method(tx.args)
    if (!txo) {
      throw new Error(`Arguments ${tx.args} did not match ${methodName} signature`)
    }
    this.addWeb3Tx(txo, { to: contract._address, value: tx.value })
  }
}
