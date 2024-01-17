import { ReleaseGoldContract, ReleaseGoldProxyContract } from 'types'
import { _setInitialProxyImplementation, retryTx } from '@celo/protocol/lib/web3-utils'

import { Address } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { celoRegistryAddress } from '@celo/protocol/lib/registry-utils'
import chalk from 'chalk'
import { newKitFromWeb3 } from '@celo/contractkit'
import prompts from 'prompts'

let fromAddress: any
let ReleaseGold: ReleaseGoldContract
let ReleaseGoldProxy: ReleaseGoldProxyContract

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
  refundAddress?: Address
  subjectToLiquidityProvision: boolean
  initialDistributionRatio: number
  canValidate: boolean
  canVote: boolean
}

const CELO_PRICE_USD = 0.758
const MENTO_MULTISIG_ADDRESS = '0x87647780180B8f55980C7D3fFeFe08a9B29e9aE1'

const REDSTONE_BENEFICIARY_ADDRESS: Address = '0xe6B210F1299a3B0D74BfA24D678A9dC1e2a27e34'

// ======= One time payment contract
const ONE_TIME_PAYMENT_AMOUNT_USD = 6600 // initial setup
const ONE_TIME_PAYMENT_AMOUNT_CELO = ONE_TIME_PAYMENT_AMOUNT_USD / CELO_PRICE_USD
const ONE_TIME_PAYMENT_RG: ReleaseGoldConfig = {
  identifier: 'Redstone One Time Payment',
  releaseStartTime: new Date('12/22/2023').toISOString(), // When first reports came on-chain after CGP145 executed
  releaseCliffTime: 60 * 60 * 24 * 30 * 3, // 3 months,
  numReleasePeriods: 1,
  releasePeriod: 1, // released inmmediately but subject to cliff
  amountReleasedPerPeriod: ONE_TIME_PAYMENT_AMOUNT_CELO,
  revocable: true,
  beneficiary: REDSTONE_BENEFICIARY_ADDRESS,
  releaseOwner: MENTO_MULTISIG_ADDRESS,
  // refundAddress: GOV_ADDRESS, // filled in later to fetch it from the network
  subjectToLiquidityProvision: false,
  initialDistributionRatio: 1000,
  canValidate: false,
  canVote: false,
}

// ======= Monthly payment contract
const MONTHLY_PAYMENT_AMOUNT = 2000 // Tier 2, up to 10 oracle fees
const MONTHLY_PAYMENT_AMOUNT_CELO = MONTHLY_PAYMENT_AMOUNT / CELO_PRICE_USD
const MONTHLY_PAYMENT_RG: ReleaseGoldConfig = {
  identifier: 'Redstone Monthly Payment',
  releaseStartTime: new Date('12/22/2023').toISOString(), // When first reports came on-chain after CGP145 executed
  releaseCliffTime: 60 * 60 * 24 * 30 * 3, // 3 months,
  numReleasePeriods: 12,
  releasePeriod: 2628000, // one month
  amountReleasedPerPeriod: MONTHLY_PAYMENT_AMOUNT_CELO,
  revocable: true,
  beneficiary: REDSTONE_BENEFICIARY_ADDRESS,
  releaseOwner: MENTO_MULTISIG_ADDRESS,
  // refundAddress: GOV_ADDRESS, // filled in later to fetch it from the network
  subjectToLiquidityProvision: false,
  initialDistributionRatio: 1000,
  canValidate: false,
  canVote: false,
}

async function handleGrant(config: ReleaseGoldConfig, currGrant: number): Promise<boolean> {
  console.info(`====== Processing grant #${currGrant} - (${config.identifier}) ======`)

  const releaseStartTime = new Date(config.releaseStartTime).getTime() / 1000
  const weiAmountReleasedPerPeriod = web3.utils.toWei(
    new BigNumber(config.amountReleasedPerPeriod).toFixed(0)
  )

  const contractInitializationArgs = [
    Math.round(releaseStartTime),
    config.releaseCliffTime,
    config.numReleasePeriods,
    config.releasePeriod,
    weiAmountReleasedPerPeriod,
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

  const message: string = `
    Please review this grant before you deploy:

    Total Grant Value (IN CELO): ${
      config.numReleasePeriods * Math.round(config.amountReleasedPerPeriod)
    }
    Beneficiary: ${config.beneficiary}
    Start Date (Unix timestamp): ${releaseStartTime}
    Cliff time (in seconds): ${config.releaseCliffTime}
    Num release periods: ${config.numReleasePeriods}
    Release period length (in seconds): ${config.releasePeriod}

    Deploy this grant? (y/n): `

  const response = await prompts({
    type: 'confirm',
    name: 'confirmation',
    message,
  })

  if (!response.confirmation) {
    console.info(chalk.yellow('❌ Skipping grant deployment... '))
    return
  }

  console.info('1. Deploying ReleaseGoldProxy...')
  const releaseGoldProxy = await retryTx(ReleaseGoldProxy.new, [{ from: fromAddress }])
  console.log(`✅ contract: ${releaseGoldProxy.address} | tx: ${releaseGoldProxy.transactionHash}`)

  console.info('2. Deploying ReleaseGold implementation...')
  const releaseGoldImpl = await retryTx(ReleaseGold.new, [false, { from: fromAddress }])
  console.log(`✅ contract: ${releaseGoldImpl.address} | tx: ${releaseGoldImpl.transactionHash}`)

  console.info('3. Initializing ReleaseGoldProxy...')
  const releaseGoldTxHash = await _setInitialProxyImplementation(
    web3,
    releaseGoldImpl,
    releaseGoldProxy,
    'ReleaseGold',
    {
      from: fromAddress,
      value: null,
    },
    ...contractInitializationArgs
  )
  console.log(`✅ tx: ${releaseGoldTxHash}`)

  console.info('4. Transferring ownership of proxy contract to governance...')
  const proxyOwnershipTx = await retryTx(releaseGoldProxy._transferOwnership, [
    config.refundAddress, // same as gov address
    { from: fromAddress },
  ])
  console.log(`✅ tx: ${proxyOwnershipTx.tx}`)

  console.info('🎉 🍾 Payment contract successfully deployed')
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(5), {
      string: ['network', 'from'],
    })

    ReleaseGold = artifacts.require('ReleaseGold')
    ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')
    fromAddress = argv.from

    const kit = newKitFromWeb3(web3)
    let governanceContract = await kit.contracts.getGovernance()
    const governanceProxyAddress = governanceContract.address

    const configOneTimePayment: ReleaseGoldConfig = {
      ...ONE_TIME_PAYMENT_RG,
      refundAddress: governanceProxyAddress,
    }

    const configMonthlyPayment: ReleaseGoldConfig = {
      ...MONTHLY_PAYMENT_RG,
      refundAddress: governanceProxyAddress,
    }

    await handleGrant(configOneTimePayment, 1)
    await handleGrant(configMonthlyPayment, 2)
  } catch (error) {
    callback(error)
  }
}
