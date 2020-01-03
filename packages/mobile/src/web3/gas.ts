import { CeloContract } from '@celo/contractkit'
import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import Logger from 'src/utils/Logger'
import { contractKit } from 'src/web3/contracts'

const TAG = 'web3/gas'
const GAS_PRICE_STALE_AFTER = 150000 // 15 seconds

let gasPrice: BigNumber | null = null
let gasPriceLastUpdated: number | null = null

export async function getGasPrice(currency: CURRENCY_ENUM = CURRENCY_ENUM.DOLLAR) {
  Logger.debug(`${TAG}/getGasPrice`, 'Getting gas price')

  try {
    if (
      !gasPriceLastUpdated ||
      !gasPrice ||
      Date.now() - gasPriceLastUpdated >= GAS_PRICE_STALE_AFTER
    ) {
      gasPrice = await fetchGasPrice(currency)
      gasPriceLastUpdated = Date.now()
    }
    return gasPrice
  } catch (error) {
    Logger.error(`${TAG}/getGasPrice`, 'Could not fetch and update gas price.', error)
    throw new Error('Error fetching gas price')
  }
}

async function fetchGasPrice(currency: CURRENCY_ENUM) {
  const gasPriceMinimum = await contractKit.contracts.getGasPriceMinimum()
  let address
  switch (currency) {
    case CURRENCY_ENUM.GOLD:
      address = await contractKit.registry.addressFor(CeloContract.GoldToken)
      break
    case CURRENCY_ENUM.DOLLAR:
      address = await contractKit.registry.addressFor(CeloContract.StableToken)
      break
  }
  const latestGasPrice = gasPriceMinimum.getGasPriceMinimum(address)
  Logger.debug(
    TAG,
    'fetchGasPrice',
    `Gas price fetched in ${currency} with value: ${latestGasPrice.toString()}`
  )
  return latestGasPrice
}
