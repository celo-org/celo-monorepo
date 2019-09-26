import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from '../config'
import { writeExchangeRatePair } from '../firebase'

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

export async function getExchangeRate(makerToken: CURRENCY_ENUM, contractKitInstance: ContractKit) {
  const exchange = await contractKitInstance.contracts.getExchange()
  const rate = await exchange.getExchangeRate(
    SELL_AMOUNTS[makerToken],
    makerToken === CURRENCY_ENUM.GOLD
  )
  return rate
}

let contractKit: ContractKit
export function getContractKit(): ContractKit {
  if (contractKit && contractKit.isListening()) {
    // Already connected
    return contractKit
  } else {
    const httpProvider = new Web3.providers.HttpProvider(WEB3_PROVIDER_URL)
    const web3 = new Web3(httpProvider)
    contractKit = newKitFromWeb3(web3)
    return contractKit
  }
}
