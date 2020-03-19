import {
  _setInitialProxyImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import BigNumber from 'bignumber.js'
import fs = require('fs')
import * as prompts from 'prompts'
import {
  GoldTokenInstance,
  RegistryInstance,
  ReleaseGoldContract,
  ReleaseGoldMultiSigContract,
  ReleaseGoldMultiSigProxyContract,
  ReleaseGoldProxyContract,
} from 'types'

let argv: any
let registry: any
let goldToken: any
let releases: any
let startGold: any
let ReleaseGoldMultiSig: ReleaseGoldMultiSigContract
let ReleaseGoldMultiSigProxy: ReleaseGoldMultiSigProxyContract
let ReleaseGold: ReleaseGoldContract
let ReleaseGoldProxy: ReleaseGoldProxyContract

async function handleGrant(releaseGoldConfig: any, currGrant: number) {
  console.info('Processing grant number ' + currGrant)

  const message =
    'Are you sure you want to deploy this contract?\n Total Grant Value: ' +
    releaseGoldConfig.numReleasePeriods * releaseGoldConfig.amountReleasedPerPeriod +
    '? (y/n)'
  if (!argv.yesreally) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message,
    })

    if (!response.confirmation) {
      console.info('Skipping grant due to user response')
      return
    }
  }
  const releaseGoldMultiSigProxy = await ReleaseGoldMultiSigProxy.new()
  const releaseGoldMultiSigInstance = await ReleaseGoldMultiSig.new()
  const multiSigTxHash = await _setInitialProxyImplementation(
    web3,
    releaseGoldMultiSigInstance,
    releaseGoldMultiSigProxy,
    'ReleaseGoldMultiSig',
    [releaseGoldConfig.releaseOwner, releaseGoldConfig.beneficiary],
    2,
    2
  )
  await releaseGoldMultiSigProxy._transferOwnership(releaseGoldMultiSigProxy.address)
  const releaseGoldProxy = await ReleaseGoldProxy.new()
  const releaseGoldInstance = await ReleaseGold.new()
  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
  )
  await goldToken.transfer(
    releaseGoldProxy.address,
    weiAmountReleasedPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
  )
  let releaseStartTime: number
  // Special mainnet string is intended as MAINNET+X where X is months after mainnet launch.
  // This is to account for the dynamic start date for mainnet,
  // and some grants rely on x months post mainnet launch.
  if (releaseGoldConfig.releaseStartTime.startsWith('MAINNET')) {
    const addedMonths = releaseGoldConfig.releaseStartTime.split('+')[1]
    const date = new Date()
    date.setMonth(date.getMonth() + Number(addedMonths))
    releaseStartTime = date.getTime() / 1000
  } else {
    releaseStartTime = new Date(releaseGoldConfig.releaseStartTime).getTime() / 1000
  }
  console.info('ReleaseSTarttime', releaseStartTime)
  const releaseGoldTxHash = await _setInitialProxyImplementation(
    web3,
    releaseGoldInstance,
    releaseGoldProxy,
    'ReleaseGold',
    Math.round(releaseStartTime),
    releaseGoldConfig.releaseCliffTime,
    releaseGoldConfig.numReleasePeriods,
    releaseGoldConfig.releasePeriod,
    web3.utils.toHex(weiAmountReleasedPerPeriod),
    releaseGoldConfig.revocable,
    releaseGoldConfig.beneficiary,
    releaseGoldConfig.releaseOwner,
    releaseGoldConfig.refundAddress,
    releaseGoldConfig.subjectToLiquidityProvision,
    releaseGoldConfig.initialDistributionRatio,
    releaseGoldConfig.canValidate,
    releaseGoldConfig.canVote,
    registry.address
  )
  const proxiedReleaseGold = await ReleaseGold.at(releaseGoldProxy.address)
  await proxiedReleaseGold.transferOwnership(releaseGoldMultiSigProxy.address)
  await releaseGoldProxy._transferOwnership(releaseGoldMultiSigProxy.address)
  // Send starting gold amount to the beneficiary so they can perform transactions.
  await goldToken.transfer(releaseGoldConfig.beneficiary, startGold)

  releases.push({
    Beneficiary: releaseGoldConfig.beneficiary,
    ProxyAddress: releaseGoldProxy.address,
    MultiSigProxyAddress: releaseGoldMultiSigProxy.address,
    MultiSigTxHash: multiSigTxHash,
    ReleaseGoldTxHash: releaseGoldTxHash,
  })
}

async function handleJSONFile(err, data) {
  if (err) {
    throw err
  }
  const grants = JSON.parse(data)
  const totalGoldGrant = grants.reduce((sum: number, curr: any) => {
    return sum + curr.amountReleasedPerPeriod
  }, 0)
  const totalTransferFees = argv.start_gold * grants.length
  const totalValue = totalTransferFees + totalGoldGrant
  if (!argv.yesreally) {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message:
        'Grants in provided json would send ' +
        totalGoldGrant +
        'cGld and ' +
        totalTransferFees +
        'cGld in transfer fees, totalling ' +
        totalValue +
        'cGld.\nIs this OK (y/n)?',
    })

    if (!response.confirmation) {
      console.info('Abandoning grant deployment.')
      process.exit(0)
    }
  }
  let currGrant = 1
  for (const releaseGoldConfig of grants) {
    await handleGrant(releaseGoldConfig, currGrant)
    currGrant++
  }
  if (argv.output_file) {
    fs.writeFile(argv.output_file, JSON.stringify(releases, null, 4), (writeError) => {
      if (writeError) {
        console.error(writeError)
        return
      }
      console.info('Wrote release results to file ' + argv.output_file + '.')
    })
  } else {
    // tslint:disable-next-line: no-console
    console.log(releases)
  }
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    argv = require('minimist')(process.argv.slice(5), {
      string: ['network', 'grants', 'start_gold', 'output_file', 'really'],
    })
    registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    goldToken = await getDeployedProxiedContract<GoldTokenInstance>('GoldToken', artifacts)
    ReleaseGoldMultiSig = artifacts.require('ReleaseGoldMultiSig')
    ReleaseGoldMultiSigProxy = artifacts.require('ReleaseGoldMultiSigProxy')
    ReleaseGold = artifacts.require('ReleaseGold')
    ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')
    releases = []
    startGold = web3.utils.toWei(argv.start_gold)
    fs.readFile(argv.grants, handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
