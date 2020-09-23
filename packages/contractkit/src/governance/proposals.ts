import { concurrentMap } from '@celo/base/lib/async'
import { isHexString } from '@celo/utils/lib/address'
import { isValidAddress, keccak256 } from 'ethereumjs-util'
import * as inquirer from 'inquirer'
import { Transaction, TransactionObject } from 'web3-eth'
import { ABIDefinition } from 'web3-eth-abi'
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

/**
 * JSON encoding of a proposal transaction.
 *
 * Example:
 * ```json
 * {
 *   "contract": "Election",
 *   "function": "setElectableValidators",
 *   "args": [ "1", "120" ],
 *   "value": "0"
 * }
 * ```
 */
export interface ProposalTransactionJSON {
  contract: CeloContract
  function: string
  args: any[]
  params?: Record<string, any>
  value: string
}

/**
 * Convert a compiled proposal to a human-readable JSON form using network information.
 * @param kit Contract kit instance used to resolve addresses to contract names.
 * @param proposal A constructed proposal object.
 * @returns The JSON encoding of the proposal.
 */
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

/**
 * Builder class to construct proposals from JSON or transaction objects.
 */
export class ProposalBuilder {
  constructor(
    private readonly kit: ContractKit,
    private readonly builders: Array<() => Promise<ProposalTransaction>> = []
  ) {}

  /**
   * Build calls all of the added build steps and returns the final proposal.
   * @returns A constructed Proposal object (i.e. a list of ProposalTransaction)
   */
  build = async () => concurrentMap(4, this.builders, (builder) => builder())

  /**
   * Converts a Web3 transaction into a proposal transaction object.
   * @param tx A Web3 transaction object to convert.
   * @param params Parameters for how the transaction should be executed.
   */
  fromWeb3tx = (tx: TransactionObject<any>, params: ProposalTxParams): ProposalTransaction => ({
    value: params.value,
    to: params.to,
    input: tx.encodeABI(),
  })

  /**
   * Adds a transaction to set the implementation on a proxy to the given address.
   * @param contract Celo contract name of the proxy which should have its implementation set.
   * @param newImplementationAddress Address of the new contract implementation.
   */
  addProxyRepointingTx = (contract: CeloContract, newImplementationAddress: string) => {
    this.builders.push(async () => {
      const proxy = await this.kit._web3Contracts.getContract(contract)
      return this.fromWeb3tx(setImplementationOnProxy(newImplementationAddress), {
        to: proxy.options.address,
        value: '0',
      })
    })
  }

  /**
   * Adds a Web3 transaction to the list for proposal construction.
   * @param tx A Web3 transaction object to add to the proposal.
   * @param params Parameters for how the transaction should be executed.
   */
  addWeb3Tx = (tx: TransactionObject<any>, params: ProposalTxParams) =>
    this.builders.push(async () => this.fromWeb3tx(tx, params))

  /**
   * Adds a Celo transaction to the list for proposal construction.
   * @param tx A Celo transaction object to add to the proposal.
   * @param params Optional parameters for how the transaction should be executed.
   */
  addTx(tx: CeloTransactionObject<any>, params: Partial<ProposalTxParams> = {}) {
    const to = params.to ?? tx.defaultParams?.to
    const value = params.value ?? tx.defaultParams?.value
    if (!to || !value) {
      throw new Error("Transaction parameters 'to' and/or 'value' not provided")
    }
    // TODO fix type of value
    this.addWeb3Tx(tx.txo, { to, value: valueToString(value.toString()) })
  }

  fromJsonTx = async (tx: ProposalTransactionJSON) => {
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
    const address = await this.kit.registry.addressFor(tx.contract)
    return this.fromWeb3tx(txo, { to: address, value: tx.value })
  }

  addJsonTx = (tx: ProposalTransactionJSON) => this.builders.push(async () => this.fromJsonTx(tx))
}

const DONE_CHOICE = '✔ done'

export class InteractiveProposalBuilder {
  constructor(private readonly builder: ProposalBuilder) {}

  async outputTransactions() {
    const transactionList = this.builder.build()
    console.log(JSON.stringify(transactionList, null, 2))
  }

  async promptTransactions() {
    const transactions: ProposalTransactionJSON[] = []
    while (true) {
      console.log(`Transaction #${transactions.length + 1}:`)

      // prompt for contract
      const contractPromptName = 'Celo Contract'
      const contractAnswer = await inquirer.prompt({
        name: contractPromptName,
        type: 'list',
        choices: [DONE_CHOICE, ...Object.keys(CeloContract)],
      })

      const choice = contractAnswer[contractPromptName]
      if (choice === DONE_CHOICE) {
        break
      }

      const contractName = choice as CeloContract
      const contractABI = require('@celo/contractkit/lib/generated/' + contractName)
        .ABI as ABIDefinition[]

      const txMethods = contractABI.filter(
        (def) => def.type === 'function' && def.stateMutability !== 'view'
      )
      const txMethodNames = txMethods.map((def) => def.name!)

      // prompt for function
      const functionPromptName = contractName + ' Function'
      const functionAnswer = await inquirer.prompt({
        name: functionPromptName,
        type: 'list',
        choices: txMethodNames,
      })
      const functionName = functionAnswer[functionPromptName] as string
      const idx = txMethodNames.findIndex((m) => m === functionName)
      const txDefinition = txMethods[idx]

      // prompt individually for each argument
      const args = []
      for (const functionInput of txDefinition.inputs!) {
        const inputAnswer = await inquirer.prompt({
          name: functionInput.name,
          type: 'input',
          validate: async (input: string) => {
            switch (functionInput.type) {
              case 'uint256':
                const parsed = parseInt(input, 10)
                return !isNaN(parsed)
              case 'boolean':
                return input === 'true' || input === 'false'
              case 'address':
                return isValidAddress(input)
              case 'bytes':
                return isHexString(input)
              default:
                return true
            }
          },
        })
        args.push(inputAnswer[functionInput.name])
      }

      // prompt for value only when tx is payable
      let value: string
      if (txDefinition.payable) {
        const valuePromptName = 'Value'
        const valueAnswer = await inquirer.prompt({
          name: valuePromptName,
          type: 'input',
        })
        value = valueAnswer[valuePromptName]
      } else {
        value = '0'
      }

      const tx: ProposalTransactionJSON = {
        contract: contractName,
        function: functionName,
        args,
        value,
      }

      try {
        // use fromJsonTx as well-formed tx validation
        await this.builder.fromJsonTx(tx)
        transactions.push(tx)
      } catch (error) {
        console.error(error)
        console.error('Please retry forming this transaction')
      }
    }

    return transactions
  }
}
