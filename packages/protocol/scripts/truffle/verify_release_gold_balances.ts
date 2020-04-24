import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import fs = require('fs')

let argv: any
let contracts: any
let configs: any
const ONE_CGLD = web3.utils.toWei('1', 'ether')

async function verifyBalance(contractAddress: any, releaseGoldConfig: any) {
  const contractBalance = new BigNumber(await web3.eth.getBalance(contractAddress))
  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
  )
  let configValue = weiAmountReleasedPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
  const adjustedAmountPerPeriod = configValue
    .minus(ONE_CGLD)
    .div(releaseGoldConfig.numReleasePeriods)
    .dp(0)

  // Reflect any rounding changes from the division above
  configValue = adjustedAmountPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
  return contractBalance.eq(configValue)
}

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
    for (const contract of contracts) {
      const config = findConfigByID(contract.Identifier)
      if (config === null) {
        console.info(
          'Identifier: ' + contract.Identifier + ' from contracts file not found in configs file.'
        )
        process.exit(0)
      }
      if (!(await verifyBalance(contract.ContractAddress, config))) {
        console.info(chalk.red('MISMATCH: Balance mismatch at identifier ' + contract.Identifier))
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
