/* tslint:disable:no-console */
import { readJsonSync, writeJsonSync } from 'fs-extra'
import { ASTDetailedVersionedReport } from '@celo/protocol/lib/compatibility/report'

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
 * Ensure libraries are linked
 * For each change in the compatibility report:
 *   deploy new implementation
 *   if storage change
 *     deploy new proxy
 *     transfer ownership to governance contract (needed?)
 *     add setAndInitializeImplementation template call to governance proposal
 *     add registry repointing call to governance proposal
 *   else
 *     find existing proxy address (how to do when not registered?) - not needed for proposal.
 *     add setImplementation call to governance proposal
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['report', 'network', 'proposal'],
    })
    const report: ASTDetailedVersionedReport = readJsonSync(argv.report).report
    const registry = await artifacts
      .require('Registry')
      .at('0x000000000000000000000000000000000000ce10')
    const governanceAddress = await registry.getAddressForString('Governance')
    const proposal = []
    for (let contractName of Object.keys(report.contracts)) {
      console.log(`Deploying ${contractName}`)
      const Contract = artifacts.require(contractName)
      const contract = await Contract.new()
      if (report.contracts[contractName].changes.storage.length === 0) {
        proposal.push({
          contract: `${contractName}Proxy`,
          function: '_setImplementation',
          args: [contract.address],
          value: '0',
        })
      } else {
        const Proxy = artifacts.require(`${contractName}Proxy`)
        const proxy = await Proxy.new()
        await proxy._transferOwnership(governanceAddress)
        proposal.push({
          contract: 'Registry',
          function: 'setAddressFor',
          args: [web3.utils.soliditySha3({ type: 'string', value: contractName }), proxy.address],
          value: '0',
        })
        proposal.push({
          contract: `${contractName}Proxy`,
          function: '_setAndInitializeImplementation',
          args: [contract.address, 'data: POPULATE ME'],
          value: '0',
        })
        // process.exit(1)
      }
    }
    writeJsonSync(argv.proposal, proposal, { spaces: 2 })
    callback()
  } catch (error) {
    callback(error)
  }
}
