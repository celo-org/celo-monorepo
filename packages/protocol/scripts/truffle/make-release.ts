/* eslint-disable max-classes-per-file: 0 */
/* eslint-disable no-console: 0 */
/* eslint:disabled ordered-imports: 0 */
import { LibraryAddresses } from '@celo/protocol/lib/bytecode'
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { getCeloContractDependencies } from '@celo/protocol/lib/contract-dependencies'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'

import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { makeTruffleContractForMigrationWithoutSingleton } from '@celo/protocol/lib/web3-utils'
import { Address, NULL_ADDRESS, eqAddress } from '@celo/utils/lib/address'
import { TruffleContract } from '@truffle/contract'

import { readJsonSync, readdirSync, writeJsonSync } from 'fs-extra'
import { basename, join } from 'path'
import { RegistryInstance } from 'types'
import { getReleaseVersion, ignoredContractsV9 } from '../../lib/compatibility/ignored-contracts-v9'
import { networks } from '../../truffle-config.js'

/*
 * A script that reads a backwards compatibility report, deploys changed contracts, and creates
 * a corresponding JSON file to be proposed with `celocli governance:propose`
 *
 * Expects the following flags:
 *   report: The filepath of the backwards compatibility report
 *   network: The network for which artifacts should be
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/make-release \
 *   --network alfajores --build_directory build/alfajores/ --report report.json \
 *   --initialize_data initialize_data.json --proposal proposal.json
 */

let ignoredContractsSet = new Set()

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class ContractAddresses {
  static async create(
    contracts: string[],
    registry: RegistryInstance,
    libraryAddresses: LibraryAddresses['addresses']
  ) {
    const addresses = new Map()
    await Promise.all(
      contracts.map(async (contract: string) => {
        // without this delay it sometimes fails with ProviderError
        await delay(getRandomNumber(1, 1000))
        try {
          const registeredAddress = await registry.getAddressForString(contract)

          if (!eqAddress(registeredAddress, NULL_ADDRESS)) {
            addresses.set(contract, registeredAddress)
          }
        } catch (error) {
          console.info('contract', contract, error)
          throw error
        }
      })
    )
    Object.entries(libraryAddresses).forEach(([library, address]) =>
      addresses.set(library, address)
    )
    return new ContractAddresses(addresses)
  }

  constructor(public addresses: Map<string, Address>) {}

  public get = (contract: string): Address => {
    if (this.addresses.has(contract)) {
      return this.addresses.get(contract)
    } else {
      throw new Error(`Unable to find address for ${contract}`)
    }
  }

  public set = (contract: string, address: Address) => {
    this.addresses.set(contract, address)
  }
}

const isProxiedContract = (contractName: string) => {
  if (contractName.endsWith('Proxy')) {
    return false
  }

  try {
    artifacts.require(`${contractName}Proxy`)
    return true
  } catch (error) {
    return false
  }
}

const isCoreContract = (contractName: string) =>
  Object.keys(CeloContractName).includes(contractName)

const deployImplementation = async (
  contractName: string,
  Contract: TruffleContract<Truffle.ContractInstance>,
  dryRun: boolean,
  from: string,
  requireVersion = true
) => {
  // const testingDeployment = false
  if (from) {
    Contract.defaults({ from }) // override truffle with provided from address
  }
  console.info(`Deploying ${contractName}`)
  // Hack to trick truffle, which checks that the provided address has code

  // without this delay it sometimes fails with ProviderError
  await delay(getRandomNumber(1, 1000))

  console.log('gas update in2')
  console.log('dryRun', dryRun)

  const bytecodeSize = (Contract.bytecode.length - 2) / 2
  console.log('Bytecode size in bytes:', bytecodeSize)

  const contract = await (dryRun
    ? Contract.at(celoRegistryAddress)
    : Contract.new({
        gas: 5000000, // Setting the gas limit
      }))

  // Sanity check that any contracts that are being changed set a version number.
  const getVersionNumberAbi = contract.abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'getVersionNumber'
  )
  if (requireVersion && !getVersionNumberAbi) {
    throw new Error(`Contract ${contractName} has changes but does not specify a version number`)
  }
  return contract
}

const deployProxy = async (
  contractName: string,
  addresses: ContractAddresses,
  dryRun: boolean,
  from: string
) => {
  // Explicitly forbid upgrading to a new Governance proxy contract.
  // Upgrading to a new Governance proxy contract would require ownership of all
  // contracts to be moved to the new governance contract, possibly including contracts
  // deployed in this script.
  // Because this depends on ordering (i.e. was the new GovernanceProxy deployed
  // before or after other contracts in this script?), and that ordering is not being
  // checked, fail if there are storage incompatible changes to Governance.
  if (contractName === 'Governance') {
    throw new Error(`Storage incompatible changes to Governance are not yet supported`)
  }
  console.info(`Deploying ${contractName}Proxy`)
  const Proxy = await artifacts.require(`${contractName}Proxy`)
  if (from) {
    Proxy.defaults({ from }) // override truffle with provided from address
  }
  // Hack to trick truffle, which checks that the provided address has code
  const proxy = await (dryRun ? Proxy.at(celoRegistryAddress) : Proxy.new())

  // This makes essentially every contract dependent on Governance.
  console.info(`Transferring ownership of ${contractName}Proxy to Governance`)
  if (!dryRun) {
    await proxy._transferOwnership(addresses.get('Governance'))
  }

  return proxy
}

const shouldDeployProxy = (report: ASTDetailedVersionedReport, contractName: string) => {
  const hasStorageChanges = report.contracts[contractName].changes.storage.length > 0
  const isNewContract = report.contracts[contractName].changes.major.find(
    (change: any) => change.type === 'NewContract'
  )
  return hasStorageChanges || isNewContract
}

const deployCoreContract = async (
  contractName: string,
  instance: Truffle.Contract<Truffle.ContractInstance>,
  proposal: ProposalTx[],
  addresses: ContractAddresses,
  report: ASTDetailedVersionedReport,
  initializationData: any,
  isDryRun: boolean,
  from: string
) => {
  const contract = await deployImplementation(contractName, instance, isDryRun, from)
  const setImplementationTx: ProposalTx = {
    contract: `${contractName}Proxy`,
    function: '_setImplementation',
    args: [contract.address],
    value: '0',
  }

  if (!shouldDeployProxy(report, contractName)) {
    proposal.push(setImplementationTx)
  } else {
    const proxy = await deployProxy(contractName, addresses, isDryRun, from)

    // Update the contract's address to the new proxy in the proposal
    addresses.set(contractName, proxy.address)
    proposal.push({
      contract: 'Registry',
      function: 'setAddressFor',
      args: [contractName, proxy.address],
      value: '0',
      description: `Registry: ${contractName} -> ${proxy.address}`,
    })

    // If the implementation has an initialize function, add it to the proposal
    const initializeAbi = (contract as any).abi.find(
      (abi: any) => abi.type === 'function' && abi.name === 'initialize'
    )
    if (initializeAbi) {
      const args = initializationData[contractName]
      let callData
      try {
        callData = web3.eth.abi.encodeFunctionCall(initializeAbi, args)
      } catch (error) {
        throw new Error(
          `Tried to initialize new implementation of ${contractName} with args: ${JSON.stringify(
            args
          )}. Initialization ABI spec is: ${JSON.stringify(initializeAbi.inputs)}.`
        )
      }
      setImplementationTx.function = '_setAndInitializeImplementation'
      setImplementationTx.args.push(callData)
    }
    console.info(
      `Add '${contractName}.${setImplementationTx.function} with ${setImplementationTx.args}' to proposal`
    )
    proposal.push(setImplementationTx)
  }
}

const deployLibrary = async (
  contractName: string,
  contractArtifact: Truffle.Contract<Truffle.ContractInstance>,
  addresses: ContractAddresses,
  isDryRun: boolean,
  from: string
) => {
  const contract = await deployImplementation(contractName, contractArtifact, isDryRun, from, false)
  addresses.set(contractName, contract.address)
  return
}

export interface ProposalTx {
  contract: string
  function: string
  args: string[]
  value: string
  description?: string
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: [
        'report',
        'from',
        'proposal',
        'librariesFile',
        'initialize_data',
        'build_directory',
        'branch',
      ],
      boolean: ['dry_run'],
    })
    const fullReport = readJsonSync(argv.report)
    const libraryMapping: LibraryAddresses['addresses'] = readJsonSync(
      argv.librariesFile ?? 'libraries.json'
    )
    const report: ASTDetailedVersionedReport = fullReport.report
    const branch = (argv.branch ? argv.branch : '') as string
    const initializationData = readJsonSync(argv.initialize_data)
    const dependencies = getCeloContractDependencies()

    const version = getReleaseVersion(branch)

    if (version >= 9) {
      ignoredContractsSet = new Set(ignoredContractsV9)
    }

    const contracts08 = readdirSync(join(argv.build_directory, 'contracts-0.8'))

    const contracts = readdirSync(join(argv.build_directory, 'contracts'))
      .concat(contracts08) // adding at the end so libraries that are already deployed don't get redeployed
      .map((x) => basename(x, '.json'))
      .filter(
        (contract) =>
          !ignoredContractsSet.has(contract) &&
          !ignoredContractsSet.has(contract.replace('Proxy', ''))
      )

    const registry = await artifacts.require('Registry').at(celoRegistryAddress)
    const addresses = await ContractAddresses.create(contracts, registry, libraryMapping)
    const released: Set<string> = new Set([])
    const proposal: ProposalTx[] = []

    const release = async (contractNameIn: string) => {
      const contractName = contractNameIn // not sure this will be needed

      // 0. Skip already released dependencies
      if (released.has(contractName)) {
        return
      }

      console.info('Dependencies for contract', contractName)

      let contractArtifact

      try {
        contractArtifact = await artifacts.require(contractName)
      } catch {
        // it wasn't found in the standard artifacts folder, check if it's 0.8 contract
        // TODO this needs generalization to support more packages
        // https://github.com/celo-org/celo-monorepo/issues/10563
        contractArtifact = makeTruffleContractForMigrationWithoutSingleton(
          contractName,
          { ...networks[argv.network], name: argv.network },
          SOLIDITY_08_PACKAGE.name,
          web3
        )
        // TODO WARNING: make sure there are no libraries with the same name that don't get deployed
      }
      const shouldDeployContract = Object.keys(report.contracts).includes(contractName)
      const shouldDeployLibrary = Object.keys(report.libraries).includes(contractName)

      if (shouldDeployContract) {
        // Don't try to deploy and link libraries of contracts it doesn't have to deploy
        // 1. Release all dependencies. Guarantees library addresses are canonical for linking.
        const contractDependencies = dependencies.get(contractName)
        for (const dependency of contractDependencies) {
          console.info('Releasing dependency', dependency)
          await release(dependency)
        }
        // 2. Link dependencies.
        await Promise.all(
          contractDependencies.map((d) => contractArtifact.link(d, addresses.get(d)))
        )
        // 3. Deploy new versions of the contract or library, if indicated by the report.
        console.info('Deploying Contract:', contractName)
        await deployCoreContract(
          contractName,
          contractArtifact,
          proposal,
          addresses,
          report,
          initializationData,
          argv.dry_run,
          argv.from
        )
      } else if (shouldDeployLibrary) {
        console.info('Deploying library:', contractName)
        await deployLibrary(contractName, contractArtifact, addresses, argv.dry_run, argv.from)
      } else {
        console.info('Not deployed:', contractName, "(it's not included in the report)")
      }

      // 4. Mark the contract as released
      released.add(contractName)
    }

    for (const contractName of contracts) {
      if (isCoreContract(contractName) && isProxiedContract(contractName)) {
        await release(contractName)
      }
    }

    writeJsonSync(argv.proposal, proposal, { spaces: 2 })
    callback()
  } catch (error) {
    callback(error)
  }
}
