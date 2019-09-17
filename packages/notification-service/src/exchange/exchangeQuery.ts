import { CURRENCY_ENUM } from '@celo/utils'
import { ContractUtils } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from '../config'
import { writeExchangeRatePair } from '../firebase'

// Amounts to estimate the exchange rate, as the rate varies based on transaction size
const SELL_AMOUNTS = {
  [CURRENCY_ENUM.DOLLAR]: new BigNumber(10000 * 1000000000000000000), // 100 dollars
  [CURRENCY_ENUM.GOLD]: new BigNumber(10 * 1000000000000000000), // 10 gold
}

export async function handleExchangeQuery(web3Instance: Web3) {
  const dollarMakerRate = await getExchangeRate(CURRENCY_ENUM.DOLLAR, web3Instance)
  writeExchangeRatePair(CURRENCY_ENUM.DOLLAR, dollarMakerRate.toString(), Date.now().toString())

  const goldMakerRate = await getExchangeRate(CURRENCY_ENUM.GOLD, web3Instance)
  writeExchangeRatePair(CURRENCY_ENUM.GOLD, goldMakerRate.toString(), Date.now().toString())
}

export async function getExchangeRate(makerToken: CURRENCY_ENUM, web3Instance: Web3) {
  const rate = await ContractUtils.getExchangeRate(
    web3Instance,
    makerToken,
    SELL_AMOUNTS[makerToken]
  )
  return rate
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
