import { sleep } from '@celo/base'
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { Context } from '../context'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'

export function runExchangeTest(context: Context) {
  describe('Exchange Test', () => {
    const logger = context.logger.child({ testGroup: 'exchange' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.Exchange, ONE.times(2))
    })

    test('exchange cUSD for CELO', async () => {
      const from = await getKey(context.mnemonic, TestAccounts.Exchange)
      context.kit.addAccount(from.privateKey)
      context.kit.defaultAccount = from.address
      const stableToken = await context.kit.contracts.getStableToken()
      context.kit.defaultFeeCurrency = stableToken.address
      const goldToken = await context.kit.contracts.getGoldToken()
      const exchange = await context.kit.contracts.getExchange()

      const previousGoldBalance = await goldToken.balanceOf(from.address)
      const goldAmount = await exchange.quoteUsdSell(ONE)
      logger.debug('exchange quote selling cUSD', { rate: goldAmount.toString() })

      const approveTx = await stableToken.approve(exchange.address, ONE.toString()).send()
      await approveTx.waitReceipt()
      logger.debug('approve tx went through')
      await sleep(5000)
      const sellTx = await exchange
        .sellDollar(
          ONE,
          // Allow 5% deviation from the quoted price
          goldAmount
            .times(0.95)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
        .send()
      const txHash = await sellTx.getHash()
      logger.debug('sellTx', { txHash })
      const receipt = await sellTx.waitReceipt()

      logger.debug('sold cUSD', { receipt })

      // Sell more to receive at least 1 cUSD back
      const goldAmountToSell = (await goldToken.balanceOf(from.address)).minus(previousGoldBalance)

      logger.debug('loss to exhange', {
        goldAmount: goldAmount.toString(),
        goldAmountToSell: goldAmountToSell.toString(),
      })

      const approveGoldTx = await goldToken
        .approve(exchange.address, goldAmountToSell.toString())
        .send()
      await approveGoldTx.waitReceipt()
      await sleep(5000)
      const sellGoldTx = await exchange
        .sellGold(
          goldAmountToSell,
          // Assume wee can get at least 80 cents back
          ONE.times(0.8)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
        .send()
      const sellGoldReceipt = await sellGoldTx.waitReceipt()

      logger.debug('sold CELO', { receipt: sellGoldReceipt })
    })
  })
}
