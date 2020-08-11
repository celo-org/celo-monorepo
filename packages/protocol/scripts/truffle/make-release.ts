/* tslint:disable:no-console */
import { readJsonSync, writeJsonSync } from 'fs-extra'
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'
import { linkedLibraries } from '@celo/protocol/migrationsConfig'

// import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'

/*
 * A script that reads a backwards compatibility report, deploys changed contracts, and creates
 * a corresponding JSON file to be proposed with `celocli governance:propose`
 *
 * Expects the following flags:
 *   report: The filepath of the backwards compatibility report
 *   network: The network for which artifacts should be
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/make-release --report TODO
 *
 */

/*
const linkLibraries = async () => {
  // How to get libAddress???
  const libAddress = '0x123456789009876543211234567890098765432112345678900987654321'
  Object.keys(linkedLibraries).forEach(async (lib: string) => {
    const Contracts = linkedLibraries[lib].map((contract: string) => artifacts.require(contract))
    await Promise.all(Contracts.map((C) => C.link(lib, libAddress))
  })
}
*/

class ContractDependencies {
  dependencies: Map<string, string[]>
  constructor(linkedLibraries: any) {
    this.dependencies = new Map()
    Object.keys(linkedLibraries).forEach((lib: string) => {
      linkedLibraries[lib].forEach((contract: string) => {
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
  dependencies: Map<string, Address>
  constructor(contracts: string[], registry: Registry) {
    this.addresses = new Map()
    contracts.forEach((contract: string) => {
      const registeredAddress = await registry.getAddressForString(contract)
      if (!eqAddress(registeredAddress, nullAddress)) {
        this.addresses.set(contract, registeredAddress)
      }
    })
  }

  public get = (contract: string): string[] => {
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

/*
 * TOOD:
 *   Ensure libraries are linked
 *     First, create a dependency graph:
 *       For each contract in the build directory, see if it links a library
 *     Second, create a mapping of contract -> address:
 *       Fetch from registry, when possible
 *       Otherwise, read from a file
 *     Then, do the following recursion:
 *       if the contract has been marked as upgraded, nothing
 *       else if the contract has not been marked as upgraded:
 *         upgrade each of its dependencies
 *         link libraries in the contract
 *         upgrade the contract
 *         set the contract -> address mapping
 *   Figure out setAndInitialize data
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['report', 'network', 'proposal', 'libraries', 'build_directory'],
    })
    const report: ASTDetailedVersionedReport = readJsonSync(argv.report).report
    const dependencies = new ContractDependencies(linkedLibraries)
    const contracts = fs.readdirSync(argv.build_directory).map((x) => path.basename(x))
    const registry = await artifacts
      .require('Registry')
      .at('0x000000000000000000000000000000000000ce10')
    const addresses = new ContractAddresses(contracts, registry)
    const released: Set<string> = new Set([])
    const proposal = []
    const release = async (contractName: string) => {
      console.log(`Releasing ${contractName}`)
      if (released.has(contractName)) {
        console.log(`Already released ${contractName}`)
        return
      } else {
        // 1. Release all dependencies.
        const contractDependencies = dependencies.get(contractName)
        contractDependencies.forEach(async (dependency: string) => {
          await release(dependency)
        })
        // 2. Link dependencies.
        const Contract = artifacts.require(contractName)
        await Promise.all(contractDependencies.map((d) => Contract.link(d, addresses.get(d))))
        // 3. Deploy new versions of the contract and proxy, if needed.
        if (Object.keys(report.contracts).includes(contractName)) {
          console.log(`Deploying implementation of ${contractName}`)
          const contract = await Contract.new()
          proposal.push({
            contract: `${contractName}Proxy`,
            function: '_setImplementation',
            args: [contract.address],
            value: '0',
          })
          if (report.contracts[contractName].changes.storage.length) {
            console.log(`Deploying proxy for ${contractName}`)
            const Proxy = artifacts.require(`${contractName}Proxy`)
            const proxy = await Proxy.new()
            proposal.push({
              contract: 'Registry',
              function: 'setAddressFor',
              args: [
                web3.utils.soliditySha3({ type: 'string', value: contractName }),
                proxy.address,
              ],
              value: '0',
            })
            // TODO(asa): Need to actually pass something here...
            await proxy._setAndInitializeImplementation('0x')
            // TODO(asa): This makes essentially every contract dependent on Governance.
            // How to handle?
            await proxy._transferOwnership(addresses.get('Governance'))
            // 4. Update the contract's address, if needed.
            addresses.set(contractName, proxy.address)
          }
        }
        // 5. Mark the contract as released
        released.add(contractName)
      }
    }
    contracts.forEach(async (contractName: string) => {
      await release(contractName)
    })
    writeJsonSync(argv.proposal, proposal, { spaces: 2 })
    callback()
  } catch (error) {
    callback(error)
  }
}
