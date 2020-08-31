import BigNumber from 'bignumber.js'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { convertToContractDecimals } from 'src/tokens/saga'
import { getContractKitAsync } from 'src/web3/contracts'

export async function celoTocUsd(celoAmount: BigNumber) {
  const celoAmountInWei = (
    await convertToContractDecimals(celoAmount, CURRENCY_ENUM.GOLD)
  ).integerValue()

  const contractKit = await getContractKitAsync()
  const exchange = await contractKit.contracts.getExchange()
  const exchangeRate = await exchange.getGoldExchangeRate(celoAmountInWei)
  const cUsdAmount = exchangeRate.multipliedBy(celoAmount)

  return cUsdAmount
}
