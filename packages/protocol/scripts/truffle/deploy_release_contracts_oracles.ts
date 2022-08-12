import { celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { retryTx, _setInitialProxyImplementation } from '@celo/protocol/lib/web3-utils'
import { Address } from '@celo/utils/lib/address'
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
let fromAddress: any
let deployedGrants: any
let deployedGrantsFile: string
let ReleaseGoldMultiSig: ReleaseGoldMultiSigContract
let ReleaseGoldMultiSigProxy: ReleaseGoldMultiSigProxyContract
let ReleaseGold: ReleaseGoldContract
let ReleaseGoldProxy: ReleaseGoldProxyContract
// const ONE_CELO = web3.utils.toWei('1', 'ether')
// const TWO_CELO = web3.utils.toWei('2', 'ether')
const MAINNET_START_TIME = new Date('22 April 2020 16:00:00 UTC').getTime() / 1000
// const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'

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

// type ReleaseGoldTemplate = Partial<ReleaseGoldConfig>
// @ts-ignore
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

  const contractInitializationArgs = [
    Math.round(releaseStartTime),
    config.releaseCliffTime,
    config.numReleasePeriods,
    config.releasePeriod,
    weiAmountReleasedPerPeriod.toFixed(),
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
    // here is where the multisig get transfered
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
        value: totalValue.toFixed(), // here this shuold be zero, but printing the amounts in the terminal
      },
      ...contractInitializationArgs
    )
    console.info('TODO: Governance proposal should send X CELO')
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
  console.info(
    '  Not Sending beneficiary any starting gold, as it is deployed in the one-time payment'
  )

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

  return record
}

function printfundingProposal(amount: number, recipientAccount: Address) {
  const proposal = [
    '{',
    `  "contract": "GolsToken",`,
    `"function": "transfer"`,
    // function transfer(address to, uint256 value) external returns (bool) {
    `"args": ["${recipientAccount}", "${amount}"],`,
    `"value": "0"`,
    `}`,
  ].join()
  console.log(proposal)
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

    releases = [] // unused

    fromAddress = argv.from

    const beneficiary = '0x'
    // @ts-ignore
    const celoPrice = 1
    const months = 12
    // @ts-ignore
    const period = '1 month'

    // todo convert to CELO
    const oneTimePayment = 3000
    const monthlyPayment = 700
    const governanceProxyAddress = '0x' // Community fund address

    const totalCeloContract = monthlyPayment * months

    // @ts-ignore
    const config = {
      identifier: '',
      releaseStartTime: 'string',
      releaseCliffTime: 1,
      numReleasePeriods: 1,
      releasePeriod: 1,
      amountReleasedPerPeriod: 1,
      revocable: true,
      beneficiary: beneficiary,
      releaseOwner: governanceProxyAddress,
      refundAddress: governanceProxyAddress,
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      canValidate: false,
      canVote: false,
    }

    // const RGInfo = await handleGrant(config, 1)
    // const RGAddress = RGInfo.ContractAddress
    const RGAddress = 'RGAddress'

    printfundingProposal(oneTimePayment, beneficiary)
    printfundingProposal(totalCeloContract, RGAddress)
  } catch (error) {
    callback(error)
  }
}
