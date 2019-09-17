import { CURRENCY_ENUM } from '@celo/utils'
import { ContractUtils } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from '../config'
import { writeExchangeRatePair } from '../firebase'

// Amounts to estimate the exchange rate, as the rate varies based on transaction size
const DOLLAR_SELL_AMOUNT_IN_WEI = new BigNumber(10000 * 1000000000000000000) // 100 dollars
const GOLD_SELL_AMOUNT_IN_WEI = new BigNumber(10 * 1000000000000000000) // 10 gold

export async function makeExchangeQuery(web3Instance: Web3) {
  const dollarMakerExchangeRate = await ContractUtils.getExchangeRate(
    web3Instance,
    CURRENCY_ENUM.DOLLAR,
    new BigNumber(DOLLAR_SELL_AMOUNT_IN_WEI)
  )
  const goldMakerExchangeRate = await ContractUtils.getExchangeRate(
    web3Instance,
    CURRENCY_ENUM.GOLD,
    new BigNumber(GOLD_SELL_AMOUNT_IN_WEI)
  )

  const fetchTime = Date.now()
  writeExchangeRatePair(
    CURRENCY_ENUM.DOLLAR,
    dollarMakerExchangeRate.toString(),
    fetchTime.toString()
  )
  writeExchangeRatePair(CURRENCY_ENUM.GOLD, goldMakerExchangeRate.toString(), fetchTime.toString())
}

let web3: Web3
export function getWeb3Instance(): Web3 {
  if (web3) {
    if (web3.eth.net.isListening()) {
      // Already connected
      return web3
    }
  }
  const httpProvider = new Web3.providers.HttpProvider(WEB3_PROVIDER_URL)
  web3 = new Web3(httpProvider)
  return web3
}
