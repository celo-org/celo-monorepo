// tslint:disable: max-classes-per-file
// tslint:disable: no-console
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { getCeloContractDependencies } from '@celo/protocol/lib/contract-dependencies'
import { CeloContractName, celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { checkImports } from '@celo/protocol/lib/web3-utils'
import { linkedLibraries } from '@celo/protocol/migrationsConfig'
import { Address, eqAddress, NULL_ADDRESS } from '@celo/utils/lib/address'
import { readdirSync, readJsonSync, writeJsonSync } from 'fs-extra'
import { LibraryAddresses } from 'lib/bytecode'
import { basename, join } from 'path'
import { TruffleContract } from 'truffle-contract'
import { RegistryInstance } from 'types'

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

class ContractAddresses {
  static async create(
    contracts: string[],
    registry: RegistryInstance,
    libraryAddresses: LibraryAddresses['addresses']
  ) {
    const addresses = new Map()
    await Promise.all(
      contracts.map(async (contract: string) => {
        const registeredAddress = await registry.getAddressForString(contract)
        if (!eqAddress(registeredAddress, NULL_ADDRESS)) {
          addresses.set(contract, registeredAddress)
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
  from: string
) => {
  const testingDeployment = false
  if (from) {
    Contract.defaults({ from }) // override truffle with provided from address
  }
  console.log(`Deploying ${contractName}`)
  // Hack to trick truffle, which checks that the provided address has code
  const contract = await (dryRun
    ? Contract.at(celoRegistryAddress)
    : checkImports('InitializableV2', Contract, artifacts)
    ? Contract.new(testingDeployment)
    : Contract.new())
  // Sanity check that any contracts that are being changed set a version number.
  const getVersionNumberAbi = contract.abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'getVersionNumber'
  )
  if (!getVersionNumberAbi) {
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
  console.log(`Deploying ${contractName}Proxy`)
  const Proxy = await artifacts.require(`${contractName}Proxy`)
  if (from) {
    Proxy.defaults({ from }) // override truffle with provided from address
  }
  // Hack to trick truffle, which checks that the provided address has code
  const proxy = await (dryRun ? Proxy.at(celoRegistryAddress) : Proxy.new())

  // This makes essentially every contract dependent on Governance.
  console.log(`Transferring ownership of ${contractName}Proxy to Governance`)
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
    console.log(
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
  const contract = await deployImplementation(contractName, contractArtifact, isDryRun, from)
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
      string: ['report', 'from', 'proposal', 'libraries', 'initialize_data', 'build_directory'],
      boolean: ['dry_run'],
    })
    const fullReport = readJsonSync(argv.report)
    const libraryMapping: LibraryAddresses['addresses'] = readJsonSync(argv.libraries)
    const report: ASTDetailedVersionedReport = fullReport.report
    const initializationData = readJsonSync(argv.initialize_data)
    const dependencies = getCeloContractDependencies()
    const contracts = readdirSync(join(argv.build_directory, 'contracts')).map((x) =>
      basename(x, '.json')
    )
    const registry = await artifacts.require('Registry').at(celoRegistryAddress)
    const addresses = await ContractAddresses.create(contracts, registry, libraryMapping)
    const released: Set<string> = new Set([])
    const proposal: ProposalTx[] = []

    const release = async (contractName: string) => {
      if (released.has(contractName)) {
        return
      }
      // 1. Release all dependencies. Guarantees library addresses are canonical for linking.
      const contractDependencies = dependencies.get(contractName)
      for (const dependency of contractDependencies) {
        await release(dependency)
      }
      // 2. Link dependencies.
      const contractArtifact = await artifacts.require(contractName)
      await Promise.all(contractDependencies.map((d) => contractArtifact.link(d, addresses.get(d))))

      // 3. Deploy new versions of the contract, if needed.
      const shouldDeployCoreContractImplementation = Object.keys(report.contracts).includes(
        contractName
      )
      const isLibrary = linkedLibraries[contractName]
      if (shouldDeployCoreContractImplementation) {
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
      } else if (isLibrary) {
        await deployLibrary(contractName, contractArtifact, addresses, argv.dry_run, argv.from)
      }
      // Mark the contract as released
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
