import { retryTx } from '@celo/protocol/lib/proxy-utils'
import { _setInitialProxyImplementation } from '@celo/protocol/lib/web3-utils'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import fs = require('fs')
import * as prompts from 'prompts'
import {
  ReleaseGoldContract,
  ReleaseGoldMultiSigContract,
  ReleaseGoldMultiSigProxyContract,
  ReleaseGoldProxyContract,
} from 'types'

let argv: any
let releases: any
let startGold: any
let fromAddress: any
let deployedGrants: any
let deployedGrantsFile: string
let ReleaseGoldMultiSig: ReleaseGoldMultiSigContract
let ReleaseGoldMultiSigProxy: ReleaseGoldMultiSigProxyContract
let ReleaseGold: ReleaseGoldContract
let ReleaseGoldProxy: ReleaseGoldProxyContract
const ONE_CGLD = web3.utils.toWei('1', 'ether')
const TWO_CGLD = web3.utils.toWei('2', 'ether')
const MAINNET_START_TIME = new Date('22 April 2020 16:00:00 UTC').getTime() / 1000

async function handleGrant(releaseGoldConfig: any, currGrant: number) {
  console.info('Processing grant number ' + currGrant)

  // Sentinel MAINNET dictates a start time of mainnet launch, April 22 2020 16:00 UTC in this case
  const releaseStartTime = releaseGoldConfig.releaseStartTime.startsWith('MAINNET')
    ? MAINNET_START_TIME
    : new Date(releaseGoldConfig.releaseStartTime).getTime() / 1000

  const message =
    'Please review this grant before you deploy:\n\tTotal Grant Value: ' +
    Number(releaseGoldConfig.numReleasePeriods) *
      Number(releaseGoldConfig.amountReleasedPerPeriod) +
    '\n\tGrant Recipient ID: ' +
    releaseGoldConfig.identifier +
    '\n\tGrant Beneficiary address: ' +
    releaseGoldConfig.beneficiary +
    '\n\tGrant Start Date (Unix timestamp): ' +
    Math.floor(releaseStartTime) +
    '\n\tGrant Cliff time (in seconds): ' +
    releaseGoldConfig.releaseCliffTime +
    '\n\tGrant num periods: ' +
    releaseGoldConfig.numReleasePeriods +
    '\n\tRelease Period length: ' +
    releaseGoldConfig.releasePeriod +
    '\n\tDeploy this grant? (y/n)'
  if (!argv.yesreally) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message,
    })

    if (!response.confirmation) {
      console.info(chalk.yellow('Skipping grant due to user response'))
      return
    }
  }
  const releaseGoldMultiSigProxy = await retryTx(ReleaseGoldMultiSigProxy.new, [
    { from: fromAddress },
  ])
  const releaseGoldMultiSigInstance = await retryTx(ReleaseGoldMultiSig.new, [
    { from: fromAddress },
  ])
  const multiSigTxHash = await _setInitialProxyImplementation(
    web3,
    releaseGoldMultiSigInstance,
    releaseGoldMultiSigProxy,
    'ReleaseGoldMultiSig',
    {
      from: fromAddress,
      value: null,
    },
    [releaseGoldConfig.releaseOwner, releaseGoldConfig.beneficiary],
    2,
    2
  )
  await retryTx(releaseGoldMultiSigProxy._transferOwnership, [
    releaseGoldMultiSigProxy.address,
    {
      from: fromAddress,
    },
  ])
  const releaseGoldProxy = await retryTx(ReleaseGoldProxy.new, [{ from: fromAddress }])
  const releaseGoldInstance = await retryTx(ReleaseGold.new, [{ from: fromAddress }])

  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
  )

  let totalValue = weiAmountReleasedPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
  if (totalValue.lt(startGold)) {
    console.info('Total value of grant less than cGLD for beneficiary addreess')
    process.exit(0)
  }
  const adjustedAmountPerPeriod = totalValue
    .minus(startGold)
    .div(releaseGoldConfig.numReleasePeriods)
    .dp(0)

  // Reflect any rounding changes from the division above
  totalValue = adjustedAmountPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)

  const releaseGoldTxHash = await _setInitialProxyImplementation(
    web3,
    releaseGoldInstance,
    releaseGoldProxy,
    'ReleaseGold',
    {
      from: fromAddress,
      value: totalValue.toFixed(),
    },
    Math.round(releaseStartTime),
    releaseGoldConfig.releaseCliffTime,
    releaseGoldConfig.numReleasePeriods,
    releaseGoldConfig.releasePeriod,
    adjustedAmountPerPeriod.toFixed(),
    releaseGoldConfig.revocable,
    releaseGoldConfig.beneficiary,
    releaseGoldConfig.releaseOwner,
    releaseGoldConfig.refundAddress,
    releaseGoldConfig.subjectToLiquidityProvision,
    releaseGoldConfig.initialDistributionRatio,
    releaseGoldConfig.canValidate,
    releaseGoldConfig.canVote,
    '0x000000000000000000000000000000000000ce10'
  )
  const proxiedReleaseGold = await ReleaseGold.at(releaseGoldProxy.address)
  await retryTx(proxiedReleaseGold.transferOwnership, [
    releaseGoldMultiSigProxy.address,
    {
      from: fromAddress,
    },
  ])
  await retryTx(releaseGoldProxy._transferOwnership, [
    releaseGoldMultiSigProxy.address,
    { from: fromAddress },
  ])
  // Send starting gold amount to the beneficiary so they can perform transactions.
  await retryTx(web3.eth.sendTransaction, [
    {
      from: fromAddress,
      to: releaseGoldConfig.beneficiary,
      value: startGold,
    },
  ])

  const record = {
    GrantNumber: currGrant,
    Identifier: releaseGoldConfig.identifier,
    Beneficiary: releaseGoldConfig.beneficiary,
    ContractAddress: releaseGoldProxy.address,
    MultiSigProxyAddress: releaseGoldMultiSigProxy.address,
    MultiSigTxHash: multiSigTxHash,
    ReleaseGoldTxHash: releaseGoldTxHash,
  }

  deployedGrants.push(releaseGoldConfig.identifier)
  releases.push(record)
  console.info('Deployed grant', record)
  // Must write to file after every grant to avoid losing info on crash.
  fs.writeFileSync(deployedGrantsFile, JSON.stringify(deployedGrants, null, 1))
  fs.writeFileSync(argv.output_file, JSON.stringify(releases, null, 2))
}

async function checkBalance(releaseGoldConfig: any) {
  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
  )
  const grantDeploymentCost = weiAmountReleasedPerPeriod
    .multipliedBy(releaseGoldConfig.numReleasePeriods)
    .plus(ONE_CGLD) // Tx Fees
    .toFixed()
  while (true) {
    const fromBalance = new BigNumber(await web3.eth.getBalance(fromAddress))
    if (fromBalance.gte(grantDeploymentCost)) {
      break
    }
    console.info(
      chalk.yellow(
        fromAddress +
          "'s balance will not cover the next grant with identifier " +
          releaseGoldConfig.identifier +
          '.'
      )
    )
    const addressResponse = await prompts({
      type: 'text',
      name: 'newFromAddress',
      message:
        "If you would like to continue deployment from a new address please provide it now. If you would like to cancel deployment please enter 'exit'. Grants already deployed will persist. \
        \nNote that the key for the current `from` address needs to remain accessible in order to roll funds over to the new `from` address.",
    })

    if (addressResponse.newFromAddress === 'exit') {
      console.info('Exiting because of user input.')
      process.exit(0)
    }

    if (!web3.utils.isAddress(addressResponse.newFromAddress)) {
      console.info(
        chalk.red('Provided address is invalid, please insert a valid Celo Address.\nRetrying.')
      )
      continue
    }
    // Must be enough to handle 1cGLD test transfer and 1cGLD for transaction fees
    if (fromBalance.gt(TWO_CGLD)) {
      console.info(
        '\nSending 1 cGLD as a test from ' +
          fromAddress +
          ' to ' +
          addressResponse.newFromAddress +
          ' to verify ownership.\n'
      )
      await retryTx(web3.eth.sendTransaction, [
        {
          from: fromAddress,
          to: addressResponse.newFromAddress,
          value: ONE_CGLD,
        },
      ])
      const confirmResponse = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message:
          'Please check the balance of your provided address. You should see the 1cGLD transfer and an initial genesis balance if this is a shard from the genesis block.\nCan you confirm this (y/n)?',
      })
      if (!confirmResponse.confirmation) {
        console.info(chalk.red('Setting new address failed.\nRetrying.'))
        continue
      }
      console.info(chalk.green('\nTransfer confirmed, sending the remaining balance.\n'))
      const fromBalancePostTransfer = new BigNumber(await web3.eth.getBalance(fromAddress))
      await retryTx(web3.eth.sendTransaction, [
        {
          from: fromAddress,
          to: addressResponse.newFromAddress,
          value: fromBalancePostTransfer.minus(ONE_CGLD).toFixed(), // minus Tx Fees
        },
      ])
    }
    const switchResponse = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message:
        'Please now switch your local wallet from ' +
        fromAddress +
        ' to ' +
        addressResponse.newFromAddress +
        '.\nIf you respond `n` here the script will exit because balance has already been sent.\nPlease confirm when you are able to switch (y/n)?',
    })
    if (!switchResponse.confirmation) {
      console.info(chalk.red('Switching wallets abandoned, exiting.'))
      process.exit(0)
    }
    fromAddress = addressResponse.newFromAddress
  }
}

async function handleJSONFile(err, data) {
  if (err) {
    throw err
  }
  const grants = JSON.parse(data)

  if (grants.length === 0) {
    console.error(
      chalk.red('Provided grants file ' + argv.grants + ' does not contain any grants.\nExiting.')
    )
    return
  }

  console.info('Verifying grants have not already been deployed.')
  for (const grant of grants) {
    if (deployedGrants.includes(grant.identifier)) {
      console.info(
        chalk.red(
          'Grant with identifier ' + grant.identifier + ' has already been deployed.\nExiting.'
        )
      )
      process.exit(0)
    }
    // Sum occurences of each identifier in the grant file, if more than 1 then there is a duplicate.
    const identifierCounts = grants.map((x) => (x.identifier === grant.identifier ? 1 : 0))
    if (identifierCounts.reduce((a, b) => a + b, 0) > 1) {
      console.info(
        chalk.red(
          'Provided grant file ' +
            argv.grants +
            ' contains a duplicate identifier: ' +
            grant.identifier +
            '.\nExiting.'
        )
      )
      process.exit(0)
    }
  }

  // Each grant type has a defined template - either they can validate and can't be revoked,
  // or vice versa. Their distribution ratios and liquidity provisions should be the same.
  // We check the first grant here and use that as a template for all grants
  // to verify the grant file is uniformly typed to hopefully avoid user errors.
  const template = {
    revocable: grants[0].revocable,
    canVote: grants[0].canVote,
    canValidate: grants[0].canValidate,
    subjectToLiquidityProvision: grants[0].subjectToLiquidityProvision,
    initialDistributionRatio: grants[0].initialDistributionRatio,
  }
  if (!argv.yesreally) {
    grants.map((grant) => {
      if (
        grant.revocable !== template.revocable ||
        grant.canVote !== template.canVote ||
        grant.canValidate !== template.canValidate ||
        grant.subjectToLiquidityProvision !== template.subjectToLiquidityProvision ||
        grant.initialDistributionRatio !== template.initialDistributionRatio
      ) {
        console.error(
          chalk.red(
            'Grants are not uniformly typed.\nWe expect all grants of a given JSON to have the same boolean values for `revocable`, `canVote`, `canValidate`, and `subjectToLiquidityProvision`, as well as having the same value for `initialDistributionRatio`.\nExiting'
          )
        )
        process.exit(0)
      }
    })
  }

  const totalValue = grants.reduce((sum: number, curr: any) => {
    return sum + Number(curr.amountReleasedPerPeriod) * Number(curr.numReleasePeriods)
  }, 0)
  const fromBalance = new BigNumber(await web3.eth.getBalance(fromAddress))
  if (!argv.yesreally) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message:
        'Grants in provided json would send ' + totalValue.toString() + 'cGld.\nIs this OK (y/n)?',
    })

    if (!response.confirmation) {
      console.info(chalk.red('Abandoning grant deployment due to user response.'))
      process.exit(0)
    }
  }

  // Check first provided address' balance
  if (fromBalance.lt(await web3.utils.toWei(totalValue.toFixed()))) {
    console.info(
      chalk.yellow(
        '\nError: The provided `from` address ' +
          fromAddress +
          "'s balance of " +
          fromBalance +
          ' is not sufficient to cover all of the grants specified in ' +
          argv.grants +
          '.\nYou will need to provide supplementary addresses (additional shards) to fund these grants.'
      )
    )
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message: 'If you know what you are doing, continue: (y/n)',
    })

    if (!response.confirmation) {
      console.info(chalk.red('Abandoning grant deployment due to user response.'))
      process.exit(0)
    }
  }
  let currGrant = 1
  for (const releaseGoldConfig of grants) {
    // Trim whitespace in case of bad copy/paste in provided json.
    releaseGoldConfig.beneficiary = releaseGoldConfig.beneficiary.trim()
    releaseGoldConfig.identifier = releaseGoldConfig.identifier.trim()
    await checkBalance(releaseGoldConfig)
    await handleGrant(releaseGoldConfig, currGrant)
    currGrant++
  }
  console.info(chalk.green('Grants deployed successfully.'))
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    argv = require('minimist')(process.argv.slice(5), {
      string: [
        'network',
        'from',
        'grants',
        'start_gold',
        'deployed_grants',
        'output_file',
        'really',
      ],
    })
    ReleaseGoldMultiSig = artifacts.require('ReleaseGoldMultiSig')
    ReleaseGoldMultiSigProxy = artifacts.require('ReleaseGoldMultiSigProxy')
    ReleaseGold = artifacts.require('ReleaseGold')
    ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')
    releases = []
    fromAddress = argv.from
    startGold = web3.utils.toWei(argv.start_gold)
    deployedGrantsFile = argv.deployed_grants
    try {
      deployedGrants = JSON.parse(fs.readFileSync(deployedGrantsFile, 'utf-8'))
    } catch (e) {
      // If this fails, file must be created
      fs.writeFile(deployedGrantsFile, '', (err) => {
        if (err) {
          throw err
        }
      })
      deployedGrants = []
    }

    if (!argv.yesreally) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message:
          'Provided `deployedGrants` file includes ' +
          deployedGrants.length +
          ' deployed grant identifiers.\nPlease verify this matches your expectations. (y/n)',
      })

      if (!response.confirmation) {
        console.info(chalk.red('Abandoning grant deployment due to user response.'))
        process.exit(0)
      }
    }
    try {
      releases = JSON.parse(fs.readFileSync(argv.output_file, 'utf-8'))
    } catch (e) {
      // If this fails, file must be created
      fs.writeFile(argv.output_file, '', (err) => {
        if (err) {
          throw err
        }
      })
      releases = []
    }
    fs.readFile(argv.grants, handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
