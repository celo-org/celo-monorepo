import { concurrentMap } from '@celo/utils/lib/async'
import { keccak256 } from 'ethereumjs-util'
import { Transaction, TransactionObject } from 'web3-eth'
import { Contract } from 'web3-eth-contract'
import { CeloContract } from '../base'
import { obtainKitContractDetails } from '../explorer/base'
import { BlockExplorer } from '../explorer/block-explorer'
import { ABI as GovernanceABI } from '../generated/Governance'
import { ContractKit } from '../kit'
import { getAbiTypes } from '../utils/web3-utils'
import { CeloTransactionObject, valueToString } from '../wrappers/BaseWrapper'
import { hotfixToParams, Proposal, ProposalTransaction } from '../wrappers/Governance'
import { setImplementationOnProxy } from './proxy'

export const HOTFIX_PARAM_ABI_TYPES = getAbiTypes(GovernanceABI as any, 'executeHotfix')

export const hotfixToEncodedParams = (kit: ContractKit, proposal: Proposal, salt: Buffer) =>
  kit.web3.eth.abi.encodeParameters(HOTFIX_PARAM_ABI_TYPES, hotfixToParams(proposal, salt))

export const hotfixToHash = (kit: ContractKit, proposal: Proposal, salt: Buffer) =>
  keccak256(hotfixToEncodedParams(kit, proposal, salt)) as Buffer

export interface ProposalTransactionJSON {
  contract: CeloContract
  function: string
  args: any[]
  params?: Record<string, any>
  value: string
}

export const proposalToJSON = async (kit: ContractKit, proposal: Proposal) => {
  const contractDetails = await obtainKitContractDetails(kit)
  const blockExplorer = new BlockExplorer(kit, contractDetails)

  return concurrentMap<ProposalTransaction, ProposalTransactionJSON>(4, proposal, async (tx) => {
    const parsedTx = blockExplorer.tryParseTx(tx as Transaction)
    if (parsedTx == null) {
      throw new Error(`Unable to parse ${tx} with block explorer`)
    }
    return {
      contract: parsedTx.callDetails.contract as CeloContract,
      function: parsedTx.callDetails.function,
      args: parsedTx.callDetails.argList,
      params: parsedTx.callDetails.paramMap,
      value: parsedTx.tx.value,
    }
  })
}

type ProposalTxParams = Pick<ProposalTransaction, 'to' | 'value'>
export class ProposalBuilder {
  constructor(
    private readonly kit: ContractKit,
    private readonly builders: Array<() => Promise<ProposalTransaction>> = []
  ) {}

  build = async () => concurrentMap(4, this.builders, (builder) => builder())

  fromWeb3tx = (tx: TransactionObject<any>, params: ProposalTxParams): ProposalTransaction => ({
    value: params.value,
    to: params.to,
    input: tx.encodeABI(),
  })

  addProxyRepointingTx = (proxyAddress: string, newImplementationAddress: string) => {
    this.addWeb3Tx(setImplementationOnProxy(newImplementationAddress), {
      to: proxyAddress,
      value: '0',
    })
  }

  addWeb3Tx = (tx: TransactionObject<any>, params: ProposalTxParams) =>
    this.builders.push(async () => this.fromWeb3tx(tx, params))

  addTx(tx: CeloTransactionObject<any>, params: Partial<ProposalTxParams> = {}) {
    const to = tx.defaultParams && tx.defaultParams.to ? tx.defaultParams.to : params.to
    const value = tx.defaultParams && tx.defaultParams.value ? tx.defaultParams.value : params.value
    if (!to || !value) {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
    // TODO fix type of value
    this.addWeb3Tx(tx.txo, { to, value: valueToString(value.toString()) })
  }

  addJsonTx = (tx: ProposalTransactionJSON) =>
    this.builders.push(async () => {
      const contract = await this.kit._web3Contracts.getContract(tx.contract)
      const methodName = tx.function
      const method = (contract.methods as Contract['methods'])[methodName]
      if (!method) {
        throw new Error(`Method ${methodName} not found on ${tx.contract}`)
      }
      const txo = method(...tx.args)
      if (!txo) {
        throw new Error(`Arguments ${tx.args} did not match ${methodName} signature`)
      }
      // TODO fix types
      return this.fromWeb3tx(txo, { to: (contract as any)._address, value: tx.value })
    })
}
