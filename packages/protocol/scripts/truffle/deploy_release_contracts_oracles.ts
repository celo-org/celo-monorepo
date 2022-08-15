import { newKitFromWeb3 } from '@celo/contractkit'
import { celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import { retryTx, _setInitialProxyImplementation } from '@celo/protocol/lib/web3-utils'
import { Address } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import fetch from 'node-fetch'
import prompts from 'prompts'
import {
  ReleaseGoldContract,
  ReleaseGoldMultiSigContract,
  ReleaseGoldMultiSigProxyContract,
  ReleaseGoldProxyContract,
} from 'types'

let argv: any
let fromAddress: any
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
  console.info(config.releaseStartTime)

  // Sentinel MAINNET dictates a start time of mainnet launch, April 22 2020 16:00 UTC in this case
  const releaseStartTime = config.releaseStartTime.startsWith('MAINNET')
    ? MAINNET_START_TIME
    : new Date(config.releaseStartTime).getTime() / 1000

  console.info(releaseStartTime)

  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(config.amountReleasedPerPeriod.toString())
  )

  // let totalValue = weiAmountReleasedPerPeriod.multipliedBy(config.numReleasePeriods)

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
  console.log([config.releaseOwner, config.beneficiary])
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
        value: '0', // here this shuold be zero, but printing the amounts in the terminal
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
  console.info(
    '  Not Sending beneficiary any starting CELO, as it is deployed in the one-time payment in the proposal'
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

  console.info('Deployed grant', record)
  return record
}

function printfundingProposal(amount: string, recipientAccount: Address) {
  const proposal = [
    '{',
    `  "contract": "GoldToken"`,
    `  "function": "transfer"`,
    // function transfer(address to, uint256 value) external returns (bool) {
    `  "args": ["${recipientAccount}", "${amount}"]`,
    `  "value": "0"`,
    `}`,
  ].join('\r\n')
  process.stdout.write(proposal)
}

async function fetchCeloPrice() {
  const response = await (await fetch('https://api.coinbase.com/v2/prices/CGLD-USD/buy')).json()
  return response['data']['amount']
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    argv = require('minimist')(process.argv.slice(5), {
      string: [
        'network',
        'from',
        'grants',
        // TODO add beneficiary, months, oneTimePaymentUSD, monthlyPaymentUSD, numberOfNodes
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

    fromAddress = argv.from

    // inputs to be added by the terminal
    let beneficiary = '0x'
    const months = 12
    const oneTimePaymentUSD = 3000
    const monthlyPaymentUSD = 700
    const numberOfNodes = 1

    const celoPrice = await fetchCeloPrice()
    console.log()
    console.log(`Celo Price is $${celoPrice} (double check this number)`)

    const period = 2628000 // one month

    const zeros = new BigNumber('1e18')

    const oneTimePaymentCELO = new BigNumber(oneTimePaymentUSD)
      .multipliedBy(zeros)
      .multipliedBy(numberOfNodes)
      .dividedBy(celoPrice)

    const monthlyPaymentCELO = new BigNumber(monthlyPaymentUSD)
      .multipliedBy(numberOfNodes)
      .dividedBy(celoPrice)

    const kit = newKitFromWeb3(web3)
    let governanceContract = await kit.contracts.getGovernance()
    const governanceProxyAddress = governanceContract.address

    console.log(`Using address for Community fund (Governance Proxy) ${governanceProxyAddress}`)
    // const governanceProxyAddress = '0xAA963FC97281d9632d96700aB62A4D1340F9a28a'

    beneficiary = '0x456f41406B32c45D59E539e4BBA3D7898c3584dA' // todo Changethis

    const now = new Date()

    const grantStartDay = new Date(now.getTime() + 60 * 60 * 24 * 10 * 1000) // 10 days from now

    const config: ReleaseGoldConfig = {
      identifier: beneficiary,
      releaseStartTime: grantStartDay.toISOString(), // one week from deploy time
      releaseCliffTime: 0,
      numReleasePeriods: months,
      releasePeriod: period,
      amountReleasedPerPeriod: Math.floor(monthlyPaymentCELO.toNumber()),
      revocable: true,
      beneficiary: beneficiary,
      releaseOwner: governanceProxyAddress,
      refundAddress: governanceProxyAddress,
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      canValidate: false,
      canVote: false,
    }

    const RGInfo = await handleGrant(config, 1)
    if (RGInfo) {
      const RGAddress = RGInfo.ContractAddress

      console.log("Here's the snippet that should be added to the proposal for this ")
      printfundingProposal(oneTimePaymentCELO.toFixed(0), beneficiary)
      console.log(',')
      printfundingProposal(
        monthlyPaymentCELO.multipliedBy(months).multipliedBy(zeros).toFixed(0),
        RGAddress
      )
      console.log('')
    } else {
      console.log('Contract not deployed')
    }
  } catch (error) {
    callback(error)
  }
}
