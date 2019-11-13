import { keccak256 } from 'ethereumjs-util'
import Contract from 'web3/eth/contract'
import { Transaction, TransactionObject } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'

import { AllContracts, CeloContract } from '../base'
import { obtainKitContractDetails } from '../explorer/base'
import { BlockExplorer } from '../explorer/block-explorer'
import { ContractKit } from '../kit'
import { CeloTransactionObject, numberLikeToString } from '../wrappers/BaseWrapper'
import { Proposal, ProposalTransaction } from '../wrappers/Governance'

export interface ProposalTransactionJSON {
  contract: CeloContract
  function: string
  args: any[]
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
export function proposalTxFromWeb3Txo(
  tx: TransactionObject<any>,
  params: Required<ProposalTxParams>
): ProposalTransaction {
  return {
    value: params.value,
    to: params.to,
    input: tx.encodeABI(),
  }
}

export function proposalTxFromCeloTxo(
  tx: CeloTransactionObject<any>,
  params: Partial<ProposalTxParams> = {}
) {
  const to = tx.defaultParams && tx.defaultParams.to ? tx.defaultParams.to : params.to
  const value = tx.defaultParams && tx.defaultParams.value ? tx.defaultParams.value : params.value
  if (!to || !value) {
    throw new Error("Transaction parameters 'to' and/or 'value' not provided")
  }
  return proposalTxFromWeb3Txo(tx.txo, { to, value: numberLikeToString(value) })
}

export async function proposalTxFromJSONAndKit(tx: ProposalTransactionJSON, kit: ContractKit) {
  const contractName = tx.contract
  if (!AllContracts.includes(contractName)) {
    throw new Error(`Contract ${contractName} not found`)
  }

  const contract = await kit._web3Contracts.getContract(contractName)
  const methodName = tx.function
  const method = (contract.methods as Contract['methods'])[methodName]
  if (!method) {
    throw new Error(`Method ${methodName} not found on ${contractName}`)
  }
  const txo = method(tx.args)
  if (!txo) {
    throw new Error(`Arguments ${tx.args} did not match ${methodName} signature`)
  }
  return proposalTxFromWeb3Txo(txo, { to: contract._address, value: tx.value })
}
