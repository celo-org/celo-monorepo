import { ContractKit } from '@celo/contractkit'
import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { writeExchangeRatePair } from '../firebase'
import { getContractKit } from '../util/utils'

// Amounts to estimate the exchange rate, as the rate varies based on transaction size
const SELL_AMOUNTS = {
  [CURRENCY_ENUM.DOLLAR]: new BigNumber(10000 * 1000000000000000000), // 100 dollars
  [CURRENCY_ENUM.GOLD]: new BigNumber(10 * 1000000000000000000), // 10 gold
}

export async function handleExchangeQuery() {
  const contractKitInstance = await getContractKit()
  const fetchTime = Date.now().toString()
  const [dollarMakerRate, goldMakerRate] = await Promise.all([
    getExchangeRate(CURRENCY_ENUM.DOLLAR, contractKitInstance),
    getExchangeRate(CURRENCY_ENUM.GOLD, contractKitInstance),
  ])

  writeExchangeRatePair(CURRENCY_ENUM.DOLLAR, dollarMakerRate.toString(), fetchTime)
  writeExchangeRatePair(CURRENCY_ENUM.GOLD, goldMakerRate.toString(), fetchTime)
}

async function getExchangeRate(makerToken: CURRENCY_ENUM, contractKitInstance: ContractKit) {
  const exchange = await contractKitInstance.contracts.getExchange()
  const rate = await exchange.getExchangeRate(
    SELL_AMOUNTS[makerToken],
    makerToken === CURRENCY_ENUM.GOLD
  )
  return rate
}
