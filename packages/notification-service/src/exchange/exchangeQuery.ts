import { CURRENCY_ENUM } from '@celo/utils'
import { ContractUtils } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

const DOLLAR_SELL_AMOUNT_IN_WEI = new BigNumber(100 * 1000000000000000000) // 100 dollars
const GOLD_SELL_AMOUNT_IN_WEI = new BigNumber(10 * 1000000000000000000) // 10 gold

export async function makeExchangeQuery(web3: Web3) {
  const dollarMakerExchangeRate: BigNumber = await ContractUtils.getExchangeRate(
    web3,
    CURRENCY_ENUM.DOLLAR,
    new BigNumber(DOLLAR_SELL_AMOUNT_IN_WEI)
  )
  const goldMakerExchangeRate: BigNumber = await ContractUtils.getExchangeRate(
    web3,
    CURRENCY_ENUM.GOLD,
    new BigNumber(GOLD_SELL_AMOUNT_IN_WEI)
  )

  console.info('Time', Date.now())
  console.info('Fetched dollar maker exchange rate', dollarMakerExchangeRate)
  console.info('Fetched gold maker exchange rate', goldMakerExchangeRate)

  // TODO write exchange rate to Firebase
}

export function getWeb3Instance(): Web3 {
  const providerUrl = 'http://35.247.50.59:8545'
  const httpProvider = new Web3.providers.HttpProvider(providerUrl)

  return new Web3(httpProvider)
}
