// tslint:disable: max-classes-per-file
// tslint:disable: no-console
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { setAndInitializeImplementation } from '@celo/protocol/lib/proxy-utils'
import { linkedLibraries } from '@celo/protocol/migrationsConfig'
import { Address, eqAddress, NULL_ADDRESS } from '@celo/utils/lib/address'
import { readdirSync, readJsonSync, writeJsonSync } from 'fs-extra'
import { basename, join } from 'path'
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

class ContractDependencies {
  dependencies: Map<string, string[]>
  constructor(libraries: { [library: string]: string[] }) {
    this.dependencies = new Map()
    Object.keys(libraries).forEach((lib: string) => {
      libraries[lib].forEach((contract: string) => {
        if (this.dependencies.has(contract)) {
          this.dependencies.get(contract).push(lib)
        } else {
          this.dependencies.set(contract, [lib])
        }
      })
    })
  }

  public get = (contract: string): string[] => {
    return this.dependencies.has(contract) ? this.dependencies.get(contract) : []
  }
}

class ContractAddresses {
  static async create(contracts: string[], registry: RegistryInstance) {
    const addresses = new Map()
    await Promise.all(
      contracts.map(async (contract: string) => {
        const registeredAddress = await registry.getAddressForString(contract)
        if (!eqAddress(registeredAddress, NULL_ADDRESS)) {
          addresses.set(contract, registeredAddress)
        }
      })
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

const REGISTRY_ADDRESS = '0x000000000000000000000000000000000000ce10'

const ensureAllContractsThatLinkLibrariesHaveChanges = (
  dependencies: ContractDependencies,
  report: ASTDetailedVersionedReport,
  contracts: string[]
) => {
  let anyContractViolates = false
  contracts.map((contract) => {
    const hasDependency = dependencies.get(contract).length > 0
    const hasChanges = report.contracts[contract]
    const isTest = contract.endsWith('Test')

    if (hasDependency && !hasChanges && !isTest) {
      console.log(
        `${contract} links ${dependencies.get(
          contract
        )} and needs to be upgraded to link proxied libraries.`
      )
      anyContractViolates = true
    }
  })

  if (anyContractViolates) {
    throw new Error('All contracts linking libraries should be upgraded in release 1')
  }
}

const deployImplementation = async (
  contractName: string,
  Contract: Truffle.Contract<Truffle.ContractInstance>,
  dryRun: boolean
) => {
  console.log(`Deploying ${contractName}`)
  // Hack to trick truffle, which checks that the provided address has code
  const contract = await (dryRun ? Contract.at(REGISTRY_ADDRESS) : Contract.new())
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
  contract: Truffle.ContractInstance,
  addresses: ContractAddresses,
  initializationData: { [contract: string]: any[] },
  dryRun: boolean
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
  // Hack to trick truffle, which checks that the provided address has code
  const proxy = await (dryRun ? Proxy.at(REGISTRY_ADDRESS) : Proxy.new())
  const initializeAbi = (contract as any).abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'initialize'
  )
  console.log(`Setting ${contractName}Proxy implementation to ${contract.address}`)
  if (initializeAbi) {
    const args = initializationData[contractName]
    console.log(`Initializing ${contractName} with: ${args}`)
    if (!dryRun) {
      await setAndInitializeImplementation(
        web3,
        proxy,
        contract.address,
        initializeAbi,
        {},
        ...args
      )
    }
  } else {
    if (!dryRun) {
      await proxy._setImplementation(contract.address)
    }
  }
  // This makes essentially every contract dependent on Governance.
  console.log(`Transferring ownership of ${contractName}Proxy to Governance`)
  if (!dryRun) {
    await proxy._transferOwnership(addresses.get('Governance'))
  }
  const proxiedContract = await artifacts.require(contractName).at(proxy.address)
  const transferOwnershipAbi = (contract as any).abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'transferOwnership'
  )
  if (transferOwnershipAbi) {
    console.log(`Transferring ownership of ${contractName} to Governance`)
    if (!dryRun) {
      await proxiedContract.transferOwnership(addresses.get('Governance'))
    }
  }
  return proxy
}

interface ProposalTx {
  contract: string
  function: string
  args: string[]
  value: string
  description?: string
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['report', 'network', 'proposal', 'libraries', 'initialize_data', 'build_directory'],
      boolean: ['dry_run'],
    })
    const report: ASTDetailedVersionedReport = readJsonSync(argv.report).report
    const initializationData = readJsonSync(argv.initialize_data)
    const dependencies = new ContractDependencies(linkedLibraries)
    const contracts = readdirSync(join(argv.build_directory, 'contracts')).map((x) =>
      basename(x, '.json')
    )
    const registry = await artifacts.require('Registry').at(REGISTRY_ADDRESS)
    const addresses = await ContractAddresses.create(contracts, registry)
    const released: Set<string> = new Set([])
    const proposal: ProposalTx[] = []
    // Release 1 will deploy all libraries with proxies so that they're more easily
    // upgradable. All contracts that link libraries should be upgraded to instead link the proxied
    // library.
    // To ensure this actually happens, we check that all contracts that link libraries are marked
    // as needing to be redeployed.
    // TODO(asa): Remove this check after release 1.
    ensureAllContractsThatLinkLibrariesHaveChanges(dependencies, report, contracts)

    const release = async (contractName: string) => {
      if (released.has(contractName)) {
        return
      } else {
        // 1. Release all dependencies.
        const contractDependencies = dependencies.get(contractName)
        for (const dependency of contractDependencies) {
          await release(dependency)
        }
        // 2. Link dependencies.
        const Contract = await artifacts.require(contractName)
        await Promise.all(contractDependencies.map((d) => Contract.link(d, addresses.get(d))))

        // This is a hack that will re-deploy all libraries with proxies, whether or not they have
        // changes to them.
        // TODO(asa): Remove `isLibrary` for future releases.
        const isLibrary = linkedLibraries[contractName]
        const shouldDeployImplementation = Object.keys(report.contracts).includes(contractName)
        const shouldDeployProxy =
          shouldDeployImplementation && report.contracts[contractName].changes.storage.length > 0
        // 3. Deploy new versions of the contract and proxy, if needed.
        if (shouldDeployImplementation || isLibrary) {
          const contract = await deployImplementation(contractName, Contract, argv.dry_run)
          if (shouldDeployProxy || isLibrary) {
            const proxy = await deployProxy(
              contractName,
              contract,
              addresses,
              initializationData,
              argv.dry_run
            )
            // 4. Update the contract's address, if needed.
            addresses.set(contractName, proxy.address)
            proposal.push({
              contract: 'Registry',
              function: 'setAddressFor',
              args: [
                web3.utils.soliditySha3({ type: 'string', value: contractName }),
                proxy.address,
              ],
              value: '0',
              description: `Registry: ${contractName} -> ${proxy.address}`,
            })
          } else {
            proposal.push({
              contract: `${contractName}Proxy`,
              function: '_setImplementation',
              args: [contract.address],
              value: '0',
            })
          }
        }
        // 5. Mark the contract as released
        released.add(contractName)
      }
    }
    for (const contractName of contracts) {
      await release(contractName)
    }
    writeJsonSync(argv.proposal, proposal, { spaces: 2 })
    callback()
  } catch (error) {
    callback(error)
  }
}
