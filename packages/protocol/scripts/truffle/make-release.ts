/* tslint:disable:no-console */
import assert = require('assert')
import { readJsonSync } from 'fs-extra'

import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'

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
 * For each change in the compatibility report:
 *   deploy new implementation
 *   if storage change
 *     deploy new proxy
 *     transfer ownership to governance contract (needed?)
 *     add setAndInitializeImplementation template call to governance proposal
 *     add registry repointing call to governance proposal
 *   else
 *     find existing proxy address (how to do when not registered?)
 *     add setImplementation call to governance proposal
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['report', 'network'],
    })
    const report = readJsonSync(argv.report)
    const proposal = []
    for (let contract of Object.keys(report.contracts)) {
      console.log(`Deploying ${contract}`)
      const Contract = artifacts.require(contract)
      deployer.deploy(Contract)
      const deployedContract = await Contract.deployed()
      if (report.contracts[contract].changes.storage.length === 0) {
        deployer.then(async () => {
          proposal.append({
            contract: `${contract}Proxy`,
            function: '_setImplementation',
            args: [deployedContract.address],
            value: '0',
          })
        })
      } else {
      }
    }
    callback()
  } catch (error) {
    callback(error)
  }
}
