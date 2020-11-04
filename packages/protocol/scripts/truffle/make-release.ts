// tslint:disable: max-classes-per-file
// tslint:disable: no-console
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { linkedLibraries } from '@celo/protocol/migrationsConfig'
import { Address, eqAddress, NULL_ADDRESS } from '@celo/utils/lib/address'
import { readdirSync, readJsonSync, writeJsonSync } from 'fs-extra'
import { CeloContractName } from 'lib/registry-utils'
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

const deployProxy = async (contractName: string, addresses: ContractAddresses, dryRun: boolean) => {
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

  // This makes essentially every contract dependent on Governance.
  console.log(`Transferring ownership of ${contractName}Proxy to Governance`)
  if (!dryRun) {
    await proxy._transferOwnership(addresses.get('Governance'))
  }

  return proxy
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
      string: ['report', 'network', 'proposal', 'libraries', 'initialize_data', 'build_directory'],
      boolean: ['dry_run'],
    })
    const fullReport = readJsonSync(argv.report)
    const report: ASTDetailedVersionedReport = fullReport.report
    const initializationData = readJsonSync(argv.initialize_data)
    const dependencies = new ContractDependencies(linkedLibraries)
    const contracts = readdirSync(join(argv.build_directory, 'contracts')).map((x) =>
      basename(x, '.json')
    )
    const registry = await artifacts.require('Registry').at(REGISTRY_ADDRESS)
    const addresses = await ContractAddresses.create(contracts, registry)
    const released: Set<string> = new Set([])
    const proposal: ProposalTx[] = []

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

        // 3. Deploy new versions of the contract, if needed.
        const shouldDeployImplementation = Object.keys(report.contracts).includes(contractName)
        const isLibrary = linkedLibraries[contractName]
        if (shouldDeployImplementation) {
          const contract = await deployImplementation(contractName, Contract, argv.dry_run)
          const setImplementationTx: ProposalTx = {
            contract: `${contractName}Proxy`,
            function: '_setImplementation',
            args: [contract.address],
            value: '0',
          }

          // 4. Deploy new versions of the proxy, if needed
          const shouldDeployProxy = report.contracts[contractName].changes.storage.length > 0
          if (!shouldDeployProxy) {
            proposal.push(setImplementationTx)
          } else {
            const proxy = await deployProxy(contractName, addresses, argv.dry_run)

            // 5. Update the contract's address to the new proxy in the proposal
            addresses.set(contractName, proxy.address)
            proposal.push({
              contract: 'Registry',
              function: 'setAddressFor',
              args: [contractName, proxy.address],
              value: '0',
              description: `Registry: ${contractName} -> ${proxy.address}`,
            })

            // 6. If the implementation has an initialize function, add it to the proposal
            const initializeAbi = (contract as any).abi.find(
              (abi: any) => abi.type === 'function' && abi.name === 'initialize'
            )
            if (initializeAbi) {
              const args = initializationData[contractName]
              const callData = web3.eth.abi.encodeFunctionCall(initializeAbi, args)
              console.log(`Add 'Initializing ${contractName} with: ${args}' to proposal`)
              proposal.push({
                contract: `${contractName}Proxy`,
                function: '_setAndInitializeImplementation',
                args: [contract.address, callData],
                value: '0',
              })
            } else {
              proposal.push(setImplementationTx)
            }
          }
        } else if (isLibrary) {
          const contract = await deployImplementation(contractName, Contract, argv.dry_run)
          addresses.set(contractName, contract.address)
        }
        // 7. Mark the contract as released
        released.add(contractName)
      }
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
