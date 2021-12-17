import { celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { _setInitialProxyImplementation, retryTx } from '@celo/protocol/lib/web3-utils'
import { Address, isValidAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import fs from 'fs'
import prompts from 'prompts'
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
const ONE_CELO = web3.utils.toWei('1', 'ether')
const TWO_CELO = web3.utils.toWei('2', 'ether')
const MAINNET_START_TIME = new Date('22 April 2020 16:00:00 UTC').getTime() / 1000
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'

interface ReleaseGoldConfig {
  identifier: string
  releaseStartTime: string
  releaseCliffTime: number
  numReleasePeriods: number
  releasePeriod: number
  amountReleasedPerPeriod: number
  revocable: boolean
  beneficiary: Address
  releaseOwner: Address
  refundAddress: Address
  subjectToLiquidityProvision: boolean
  initialDistributionRatio: number
  canValidate: boolean
  canVote: boolean
}

type ReleaseGoldTemplate = Partial<ReleaseGoldConfig>

async function handleGrant(config: ReleaseGoldConfig, currGrant: number) {
  console.info('Processing grant number ' + currGrant)

  // Sentinel MAINNET dictates a start time of mainnet launch, April 22 2020 16:00 UTC in this case
  const releaseStartTime = config.releaseStartTime.startsWith('MAINNET')
    ? MAINNET_START_TIME
    : new Date(config.releaseStartTime).getTime() / 1000

  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(config.amountReleasedPerPeriod.toString())
  )

  let totalValue = weiAmountReleasedPerPeriod.multipliedBy(config.numReleasePeriods)
  if (totalValue.lt(startGold)) {
    console.info('Total value of grant less than CELO for beneficiary addreess')
    return
  }

  const adjustedAmountPerPeriod = totalValue.minus(startGold).div(config.numReleasePeriods).dp(0)

  // Reflect any rounding changes from the division above
  totalValue = adjustedAmountPerPeriod.multipliedBy(config.numReleasePeriods)

  const contractInitializationArgs = [
    Math.round(releaseStartTime),
    config.releaseCliffTime,
    config.numReleasePeriods,
    config.releasePeriod,
    adjustedAmountPerPeriod.toFixed(),
    config.revocable,
    config.beneficiary,
    config.releaseOwner,
    config.refundAddress,
    config.subjectToLiquidityProvision,
    config.initialDistributionRatio,
    config.canValidate,
    config.canVote,
    celoRegistryAddress,
  ]

  const bytecode = await web3.eth.getCode(config.beneficiary)
  if (bytecode !== '0x') {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message: `Beneficiary ${config.beneficiary} is a smart contract which might cause loss of funds if not properly configured. Are you sure you want to continue? (y/n)`,
    })

    if (!response.confirmation) {
      console.info(chalk.yellow('Skipping grant due to user response'))
      return
    }
  }

  const message =
    'Please review this grant before you deploy:\n\tTotal Grant Value: ' +
    Number(config.numReleasePeriods) * Number(config.amountReleasedPerPeriod) +
    '\n\tGrant Recipient ID: ' +
    config.identifier +
    '\n\tGrant Beneficiary address: ' +
    config.beneficiary +
    '\n\tGrant Start Date (Unix timestamp): ' +
    Math.floor(releaseStartTime) +
    '\n\tGrant Cliff time (in seconds): ' +
    config.releaseCliffTime +
    '\n\tGrant num periods: ' +
    config.numReleasePeriods +
    '\n\tRelease Period length: ' +
    config.releasePeriod +
    (argv.debug
      ? '\n\tDebug: Contract init args: ' + JSON.stringify(contractInitializationArgs)
      : '') +
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
  console.info('  Deploying ReleaseGoldMultiSigProxy...')
  const releaseGoldMultiSigProxy = await retryTx(ReleaseGoldMultiSigProxy.new, [
    { from: fromAddress },
  ])
  console.info('  Deploying ReleaseGoldMultiSig...')
  const releaseGoldMultiSigInstance = await retryTx(ReleaseGoldMultiSig.new, [
    false,
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
    [config.releaseOwner, config.beneficiary],
    2,
    2
  )
  await retryTx(releaseGoldMultiSigProxy._transferOwnership, [
    releaseGoldMultiSigProxy.address,
    {
      from: fromAddress,
    },
  ])
  console.info('  Deploying ReleaseGoldProxy...')
  const releaseGoldProxy = await retryTx(ReleaseGoldProxy.new, [{ from: fromAddress }])
  console.info('  Deploying ReleaseGold...')
  const releaseGoldInstance = await retryTx(ReleaseGold.new, [false, { from: fromAddress }])

  console.info('Initializing ReleaseGoldProxy...')
  let releaseGoldTxHash
  try {
    releaseGoldTxHash = await _setInitialProxyImplementation(
      web3,
      releaseGoldInstance,
      releaseGoldProxy,
      'ReleaseGold',
      {
        from: fromAddress,
        value: totalValue.toFixed(),
      },
      ...contractInitializationArgs
    )
  } catch (e) {
    console.info(
      'Something went wrong! Consider using the recover-funds.ts script with the below address'
    )
    console.info('ReleaseGoldProxy', releaseGoldProxy.address)
    throw e
  }
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
  console.info('  Sending beneficiary starting gold...')
  await retryTx(web3.eth.sendTransaction, [
    {
      from: fromAddress,
      to: config.beneficiary,
      value: startGold,
    },
  ])

  const record = {
    GrantNumber: currGrant,
    Identifier: config.identifier,
    Beneficiary: config.beneficiary,
    ContractAddress: releaseGoldProxy.address,
    MultiSigProxyAddress: releaseGoldMultiSigProxy.address,
    MultiSigTxHash: multiSigTxHash,
    ReleaseGoldTxHash: releaseGoldTxHash,
  }

  deployedGrants.push(config.identifier)
  releases.push(record)
  console.info('Deployed grant', record)
  // Must write to file after every grant to avoid losing info on crash.
  fs.writeFileSync(deployedGrantsFile, JSON.stringify(deployedGrants, null, 1))
  fs.writeFileSync(argv.output_file, JSON.stringify(releases, null, 2))
}

async function checkBalance(config: ReleaseGoldConfig) {
  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(config.amountReleasedPerPeriod.toString())
  )
  const grantDeploymentCost = weiAmountReleasedPerPeriod
    .multipliedBy(config.numReleasePeriods)
    .plus(ONE_CELO) // Tx Fees
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
          config.identifier +
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
    // Must be enough to handle 1CELO test transfer and 1CELO for transaction fees
    if (fromBalance.gt(TWO_CELO)) {
      console.info(
        '\nSending 1 CELO as a test from ' +
          fromAddress +
          ' to ' +
          addressResponse.newFromAddress +
          ' to verify ownership.\n'
      )
      await retryTx(web3.eth.sendTransaction, [
        {
          from: fromAddress,
          to: addressResponse.newFromAddress,
          value: ONE_CELO,
        },
      ])
      const confirmResponse = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message:
          'Please check the balance of your provided address. You should see the 1CELO transfer and an initial genesis balance if this is a shard from the genesis block.\nCan you confirm this (y/n)?',
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
          value: fromBalancePostTransfer.minus(ONE_CELO).toFixed(), // minus Tx Fees
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

async function compile(template: ReleaseGoldTemplate): Promise<ReleaseGoldConfig> {
  const isUnspecified = (value: any): boolean => {
    return value === undefined || value === null
  }

  const questions = []
  if (isUnspecified(template.identifier)) {
    questions.push({
      type: 'text',
      name: 'identifier',
      message: 'Identifier',
    })
  }
  if (isUnspecified(template.releaseStartTime)) {
    questions.push({
      type: 'text',
      name: 'releaseStartTime',
      inital: 'MAINNET+0',
      message: 'Release start time',
    })
  }
  if (isUnspecified(template.releaseCliffTime)) {
    questions.push({
      type: 'number',
      name: 'releaseCliffTime',
      message: 'Release cliff time',
      min: 0,
    })
  }
  if (isUnspecified(template.numReleasePeriods)) {
    questions.push({
      type: 'number',
      name: 'numReleasePeriods',
      message: 'Number of release periods',
      min: 1,
    })
  }
  if (isUnspecified(template.releasePeriod)) {
    questions.push({
      type: 'number',
      name: 'releasePeriod',
      message: 'Release period time',
      min: 1,
    })
  }
  if (isUnspecified(template.amountReleasedPerPeriod)) {
    questions.push({
      type: 'number',
      name: 'amountReleasedPerPeriod',
      message: 'Amount released per period',
      min: 0,
    })
  }
  if (isUnspecified(template.revocable)) {
    questions.push({
      type: 'toggle',
      name: 'revocable',
      message: 'Revocable?',
    })
  }
  if (isUnspecified(template.beneficiary)) {
    questions.push({
      type: 'text',
      name: 'beneficiary',
      message: 'Beneficiary',
      initial: (_, { identifier }) =>
        isValidAddress(identifier ?? template.identifier) ? identifier : null,
      validate: (value) =>
        isValidAddress(value) && value !== ZERO_ADDRESS
          ? true
          : 'Please enter a valid non-zero Celo address.',
    })
  }
  if (isUnspecified(template.releaseOwner)) {
    questions.push({
      type: 'text',
      name: 'releaseOwner',
      message: 'Release owner',
      validate: (value) =>
        isValidAddress(value) && value !== ZERO_ADDRESS
          ? true
          : 'Please enter a valid non-zero Celo address.',
    })
  }
  if (isUnspecified(template.refundAddress)) {
    questions.push({
      type: 'text',
      name: 'refundAddress',
      message: 'Refund address',
      initial: ZERO_ADDRESS,
      validate: (value) => (isValidAddress(value) ? true : 'Please enter a valid Celo address.'),
    })
  }
  if (isUnspecified(template.subjectToLiquidityProvision)) {
    questions.push({
      type: 'toggle',
      name: 'subjectToLiquidityProvision',
      message: 'Subject to liquidity provision?',
    })
  }
  if (isUnspecified(template.initialDistributionRatio)) {
    questions.push({
      type: 'number',
      name: 'initialDistributionRatio',
      message: 'Initial distribution ratio',
      initial: 1000,
      min: 0,
      max: 1000,
    })
  }
  if (isUnspecified(template.canValidate)) {
    questions.push({
      type: 'toggle',
      name: 'canValidate',
      message: 'Can validate?',
    })
  }
  if (isUnspecified(template.canVote)) {
    questions.push({
      type: 'toggle',
      name: 'canVote',
      message: 'Can vote?',
    })
  }

  if (questions.length === 0) {
    return template as ReleaseGoldConfig
  }

  const onCancel = () => {
    console.error('Exiting because input canceled.')
    process.exit(0)
  }

  console.info(
    `\nGrant: ${JSON.stringify(template, undefined, 2)}\nUnspecified: ${questions
      .map((q) => q.name)
      .join(', ')}`
  )
  const config: ReleaseGoldConfig = {
    ...template,
    // @ts-ignore: onSubmit is erroneously required in the type.
    ...(await prompts(questions, { onCancel })),
  }
  return config
}

async function handleJSONFile(data) {
  const templates: ReleaseGoldTemplate[] = JSON.parse(data)
  const grants: ReleaseGoldConfig[] = []
  for (const t of templates) {
    grants.push(await compile(t))
  }

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
        'Grants in provided json would send ' + totalValue.toString() + 'CELO.\nIs this OK (y/n)?',
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
  for (const config of grants) {
    // Trim whitespace in case of bad copy/paste in provided json.
    config.beneficiary = config.beneficiary.trim()
    config.identifier = config.identifier.trim()
    await checkBalance(config)
    await handleGrant(config, currGrant)
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
        'debug',
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
    fs.readFile(argv.grants, async (err, data) => {
      if (err) {
        throw err
      }
      await handleJSONFile(data)
      // Indicate success and exit.
      callback()
    })
  } catch (error) {
    callback(error)
  }
}
