import { ContractKit } from '@celo/contractkit'
import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { writeExchangeRatePair } from '../firebase'
import { getContractKit } from '../util/utils'

// Amounts to estimate the exchange rate, as the rate varies based on transaction size
const SELL_AMOUNTS = {
  [CURRENCY_ENUM.DOLLAR]: new BigNumber(1 * 1000000000000000000), // 1 dollar
  [CURRENCY_ENUM.GOLD]: new BigNumber(1 * 1000000000000000000), // 1 gold
}

export async function handleExchangeQuery() {
  const contractKitInstance = await getContractKit()
  const fetchTime = Date.now()
  const [dollarMakerRate, goldMakerRate] = await Promise.all([
    getExchangeRate(CURRENCY_ENUM.DOLLAR, contractKitInstance),
    getExchangeRate(CURRENCY_ENUM.GOLD, contractKitInstance),
  ])

  writeExchangeRatePair(
    CURRENCY_ENUM.GOLD,
    CURRENCY_ENUM.DOLLAR,
    dollarMakerRate.toString(),
    fetchTime
  )
  writeExchangeRatePair(
    CURRENCY_ENUM.DOLLAR,
    CURRENCY_ENUM.GOLD,
    goldMakerRate.toString(),
    fetchTime
  )
}

async function getExchangeRate(makerToken: CURRENCY_ENUM, contractKitInstance: ContractKit) {
  const exchange = await contractKitInstance.contracts.getExchange()
  const rate = await exchange.getExchangeRate(
    SELL_AMOUNTS[makerToken],
    makerToken === CURRENCY_ENUM.GOLD
  )
  return rate
}
