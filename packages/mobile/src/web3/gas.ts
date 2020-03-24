import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { getCurrencyAddress } from 'src/tokens/saga'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'

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
  const gasPriceMinimum = await getContractKit().contracts.getGasPriceMinimum()
  const address = await getCurrencyAddress(currency)
  const latestGasPrice = await gasPriceMinimum.getGasPriceMinimum(address)
  Logger.debug(
    TAG,
    'fetchGasPrice',
    `Gas price fetched in ${currency} with value: ${latestGasPrice.toString()}`
  )
  return latestGasPrice
}
