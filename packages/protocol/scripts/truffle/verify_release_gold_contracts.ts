import chalk from 'chalk'
import { ReleaseGoldMultiSigProxyContract, ReleaseGoldProxyContract } from 'types'
import { ReleaseGoldContract, ReleaseGoldMultiSigContract } from 'types/08'
import fs = require('fs')

let argv: any
let contracts: any
let configs: any
let ReleaseGold: ReleaseGoldContract
let ReleaseGoldProxy: ReleaseGoldProxyContract
let ReleaseGoldMultiSig: ReleaseGoldMultiSigContract
let ReleaseGoldMultiSigProxy: ReleaseGoldMultiSigProxyContract
// const ONE_CGLD = web3.utils.toWei('1', 'ether')

async function verifyContract(contract: any, config: any) {
  let verified = true
  // Balance check should only be used immediately after contract deployments.
  // Otherwise, balances may increase via rewards, or decrease via withdrawals, leading to false negatives.
  // verified = verified && (await verifyBalance(contract.ContractAddress, config))
  verified = verified && (await verifyMultisig(contract.MultiSigProxyAddress, config))
  verified =
    verified &&
    (await verifyReleaseGold(contract.ContractAddress, contract.MultiSigProxyAddress, config))
  return verified
}

async function verifyMultisig(multiSigAddress: any, config: any) {
  const releaseGoldMultiSig = await ReleaseGoldMultiSig.at(multiSigAddress)
  let contractOwners = await releaseGoldMultiSig.getOwners()
  let configOwners = [config.beneficiary, config.releaseOwner]
  contractOwners = contractOwners.map((x) => x.toLowerCase())
  configOwners = configOwners.map((x) => x.toLowerCase())
  for (let i = 0; i < contractOwners.length; i++) {
    if (contractOwners.indexOf(configOwners[i]) === -1) {
      console.info(
        chalk.red(
          "Multisig contracts' owners are not properly set to `beneficiary` and `releaseOwner`. This is possible (if the user elected to change their beneficiary) but uncommon."
        )
      )
      return false
    }
  }
  const releaseGoldMultiSigProxy = await ReleaseGoldMultiSigProxy.at(multiSigAddress)
  if (
    (await releaseGoldMultiSigProxy._getOwner()).toLowerCase() !== multiSigAddress.toLowerCase()
  ) {
    console.info(chalk.red('ReleaseGoldMultiSigProxy is not properly set.'))
    return false
  }
  return true
}

async function verifyReleaseGold(releaseGoldAddress: any, multiSigAddress: any, config: any) {
  const releaseGold = await ReleaseGold.at(releaseGoldAddress)
  const releaseGoldProxy = await ReleaseGoldProxy.at(releaseGoldAddress)
  if ((await releaseGold.owner()).toLowerCase() !== multiSigAddress.toLowerCase()) {
    console.info(chalk.red('ReleaseGold owner not properly set.'))
    return false
  }
  if ((await releaseGoldProxy._getOwner()).toLowerCase() !== multiSigAddress.toLowerCase()) {
    console.info(chalk.red('ReleaseGoldProxy owner not properly set'))
    return false
  }
  if ((await releaseGold.beneficiary()).toLowerCase() !== config.beneficiary.toLowerCase()) {
    console.info(chalk.red('Beneficiary from config does not match contract'))
    return false
  }
  return true
}

// Uncomment if using `verifyBalance` just after contract deployment.
// async function verifyBalance(contractAddress: any, releaseGoldConfig: any) {
//   const contractBalance = new BigNumber(await web3.eth.getBalance(contractAddress))
//   const weiAmountReleasedPerPeriod = new BigNumber(
//     web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
//   )
//   let configValue = weiAmountReleasedPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
//   const adjustedAmountPerPeriod = configValue
//     .minus(ONE_CGLD)
//     .div(releaseGoldConfig.numReleasePeriods)
//     .dp(0)

//   // Reflect any rounding changes from the division above
//   configValue = adjustedAmountPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
//   if (!contractBalance.eq(configValue)) {
//     console.info(chalk.yellow("Contract balance does not match configured amount. This is likely because of the balance increasing from rewards or users sending more CELO, please verify:\nConfigured amount:" + configValue.toFixed() + ", Contract Balance:" + contractBalance.toFixed()))
//     return false
//   }
//   return true
// }

function findConfigByID(identifier) {
  for (const config of configs) {
    if (config.identifier === identifier) {
      return config
    }
  }
  return null
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    argv = require('minimist')(process.argv.slice(3), {
      string: ['network', 'contracts_file', 'config_file'],
    })
    try {
      contracts = JSON.parse(fs.readFileSync(argv.contract_json, 'utf-8'))
      configs = JSON.parse(fs.readFileSync(argv.config_json, 'utf-8'))
    } catch (e) {
      console.info('Fail - bad file given, error: ' + e)
      process.exit(0)
    }
    if (contracts.length !== configs.length) {
      console.info('Lengths do not match, exiting')
      process.exit(0)
    }
    const failures = []
    ReleaseGold = artifacts.require('ReleaseGold')
    ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')
    ReleaseGoldMultiSig = artifacts.require('ReleaseGoldMultiSig')
    ReleaseGoldMultiSigProxy = artifacts.require('ReleaseGoldMultiSigProxy')
    for (const contract of contracts) {
      const config = findConfigByID(contract.Identifier)
      if (config === null) {
        console.info(
          'Identifier: ' + contract.Identifier + ' from contracts file not found in configs file.'
        )
        process.exit(0)
      }
      if (!(await verifyContract(contract, config))) {
        console.info(
          chalk.red(
            'MISMATCH: Contract with identifier ' + contract.Identifier + ' is not verified.'
          )
        )
        failures.push(contract.Identifier)
      }
    }
    if (failures.length > 0) {
      console.info(
        failures.length +
          ' mismatches were identified, please review the output identifiers above.\nOutputting failures to `failureOutput.json`.'
      )
      fs.writeFileSync('failureOutput.json', JSON.stringify(failures, null, 2))
    }
  } catch (error) {
    callback(error)
  }
}
