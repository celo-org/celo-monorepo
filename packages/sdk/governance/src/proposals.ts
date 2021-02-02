import { Address, isHexString, trimLeading0x } from '@celo/base/lib/address'
import {
  ABIDefinition,
  CeloTransactionObject,
  CeloTxObject,
  CeloTxPending,
  Contract,
  getAbiTypes,
  parseDecodedParams,
} from '@celo/connect'
import { CeloContract, ContractKit, RegisteredContracts } from '@celo/contractkit'
import { ABI as GovernanceABI } from '@celo/contractkit/lib/generated/Governance'
// tslint:disable: ordered-imports
import {
  getInitializeAbiOfImplementation,
  setImplementationOnProxy,
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI,
  SET_IMPLEMENTATION_ABI,
} from '@celo/contractkit/lib/proxy'
// tslint:enable: ordered-imports
import { valueToString } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import {
  hotfixToParams,
  Proposal,
  ProposalTransaction,
} from '@celo/contractkit/lib/wrappers/Governance'
import { BlockExplorer, obtainKitContractDetails } from '@celo/explorer'
import { isValidAddress } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import { keccak256 } from 'ethereumjs-util'
import * as inquirer from 'inquirer'

const debug = debugFactory('governance:proposals')

export const HOTFIX_PARAM_ABI_TYPES = getAbiTypes(GovernanceABI as any, 'executeHotfix')

export const hotfixToEncodedParams = (kit: ContractKit, proposal: Proposal, salt: Buffer) =>
  kit.connection
    .getAbiCoder()
    .encodeParameters(HOTFIX_PARAM_ABI_TYPES, hotfixToParams(proposal, salt))

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

const isRegistryRepoint = (tx: ProposalTransactionJSON) =>
  tx.contract === 'Registry' && tx.function === 'setAddressFor'

const isProxySetAndInitFunction = (tx: ProposalTransactionJSON) =>
  tx.function === SET_AND_INITIALIZE_IMPLEMENTATION_ABI.name!

const isProxySetFunction = (tx: ProposalTransactionJSON) =>
  tx.function === SET_IMPLEMENTATION_ABI.name!

/**
 * Convert a compiled proposal to a human-readable JSON form using network information.
 * @param kit Contract kit instance used to resolve addresses to contract names.
 * @param proposal A constructed proposal object.
 * @returns The JSON encoding of the proposal.
 */
export const proposalToJSON = async (kit: ContractKit, proposal: Proposal) => {
  const contractDetails = await obtainKitContractDetails(kit)
  const blockExplorer = new BlockExplorer(kit, contractDetails)

  const proposalJson: ProposalTransactionJSON[] = []
  for (const tx of proposal) {
    debug(`decoding tx ${tx}`)
    const parsedTx = await blockExplorer.tryParseTx(tx as CeloTxPending)
    if (parsedTx == null) {
      throw new Error(`Unable to parse ${tx} with block explorer`)
    }

    const jsonTx: ProposalTransactionJSON = {
      contract: parsedTx.callDetails.contract as CeloContract,
      function: parsedTx.callDetails.function,
      args: parsedTx.callDetails.argList,
      params: parsedTx.callDetails.paramMap,
      value: parsedTx.tx.value,
    }

    if (isRegistryRepoint(jsonTx)) {
      const [name, address] = jsonTx.args
      await blockExplorer.updateContractDetailsMapping(name, address)
    } else if (isProxySetFunction(jsonTx)) {
      jsonTx.contract = `${jsonTx.contract}Proxy` as CeloContract
    } else if (isProxySetAndInitFunction(jsonTx)) {
      jsonTx.contract = `${jsonTx.contract}Proxy` as CeloContract

      // Transform delegate call initialize args into a readable params map
      const initAbi = getInitializeAbiOfImplementation(jsonTx.contract as any)

      // 8 bytes for function sig
      const initSig = trimLeading0x(jsonTx.args[1]).slice(0, 8)
      const initArgs = trimLeading0x(jsonTx.args[1]).slice(8)

      const { params: initParams } = parseDecodedParams(
        kit.connection.getAbiCoder().decodeParameters(initAbi.inputs!, initArgs)
      )
      jsonTx.params![`initialize@${initSig}`] = initParams
    }

    proposalJson.push(jsonTx)
  }
  return proposalJson
}

type ProposalTxParams = Pick<ProposalTransaction, 'to' | 'value'>
interface RegistryAdditions {
  [contractName: string]: Address
}

/**
 * Builder class to construct proposals from JSON or transaction objects.
 */
export class ProposalBuilder {
  constructor(
    private readonly kit: ContractKit,
    private readonly builders: Array<() => Promise<ProposalTransaction>> = [],
    private readonly registryAdditions: RegistryAdditions = {}
  ) {}

  /**
   * Build calls all of the added build steps and returns the final proposal.
   * @returns A constructed Proposal object (i.e. a list of ProposalTransaction)
   */
  build = async () => {
    const ret = []
    for (const builder of this.builders) {
      ret.push(await builder())
    }
    return ret
  }

  /**
   * Converts a Web3 transaction into a proposal transaction object.
   * @param tx A Web3 transaction object to convert.
   * @param params Parameters for how the transaction should be executed.
   */
  fromWeb3tx = (tx: CeloTxObject<any>, params: ProposalTxParams): ProposalTransaction => ({
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
      return this.fromWeb3tx(
        setImplementationOnProxy(newImplementationAddress, this.kit.connection.web3),
        {
          to: proxy.options.address,
          value: '0',
        }
      )
    })
  }

  /**
   * Adds a Web3 transaction to the list for proposal construction.
   * @param tx A Web3 transaction object to add to the proposal.
   * @param params Parameters for how the transaction should be executed.
   */
  addWeb3Tx = (tx: CeloTxObject<any>, params: ProposalTxParams) =>
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
    // Account for canonical registry addresses from current proposal
    let address = this.registryAdditions[tx.contract]

    if (!address) {
      address = await this.kit.registry.addressFor(tx.contract)
    }

    if (isRegistryRepoint(tx)) {
      // Update canonical registry addresses
      this.registryAdditions[tx.args[0]] = tx.args[1]
      this.registryAdditions[tx.args[0] + 'Proxy'] = tx.args[1]
    } else if (
      tx.function === SET_AND_INITIALIZE_IMPLEMENTATION_ABI.name &&
      Array.isArray(tx.args[1])
    ) {
      // Transform array of initialize arguments (if provided) into delegate call data
      tx.args[1] = this.kit.connection
        .getAbiCoder()
        .encodeFunctionCall(getInitializeAbiOfImplementation(tx.contract as any), tx.args[1])
    }

    const contract = await this.kit._web3Contracts.getContract(tx.contract, address)
    const methodName = tx.function
    const method = (contract.methods as Contract['methods'])[methodName]
    if (!method) {
      throw new Error(`Method ${methodName} not found on ${tx.contract}`)
    }
    const txo = method(...tx.args)
    if (!txo) {
      throw new Error(`Arguments ${tx.args} did not match ${methodName} signature`)
    }

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
        choices: [DONE_CHOICE, ...RegisteredContracts],
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
                try {
                  // tslint:disable-next-line: no-unused-expression
                  new BigNumber(input)
                  return true
                } catch (e) {
                  return false
                }
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

        // @ts-ignore
        const answer: string = inputAnswer[functionInput.name]
        const transformedValue =
          functionInput.type === 'uint256' ? new BigNumber(answer).toString() : answer
        args.push(transformedValue)
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
