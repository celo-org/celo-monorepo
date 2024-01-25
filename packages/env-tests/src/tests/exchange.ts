import { sleep } from '@celo/base'
import { StableToken } from '@celo/contractkit'
// eslint-disable-next-line  import/no-extraneous-dependencies
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import { fundAccountWithStableToken, getKey, ONE, TestAccounts } from '../scaffold'

export function runExchangeTest(context: EnvTestContext, stableTokensToTest: StableToken[]) {
  describe('Exchange Test', () => {
    const logger = context.logger.child({ test: 'exchange' })

    for (const stableToken of stableTokensToTest) {
      test(`exchange ${stableToken} for CELO`, async () => {
        const stableTokenAmountToFund = ONE
        await fundAccountWithStableToken(
          context,
          TestAccounts.Exchange,
          stableTokenAmountToFund,
          stableToken
        )
        const stableTokenInstance = await context.kit.celoTokens.getWrapper(stableToken)

        const from = await getKey(context.mnemonic, TestAccounts.Exchange)
        context.kit.connection.addAccount(from.privateKey)
        context.kit.defaultAccount = from.address
        context.kit.connection.defaultFeeCurrency = stableTokenInstance.address
        const goldToken = await context.kit.contracts.getGoldToken()

        const exchange = await context.kit.contracts.getExchange(stableToken)
        const previousGoldBalance = await goldToken.balanceOf(from.address)
        const stableTokenAmountToSell = stableTokenAmountToFund.times(0.5)
        const goldAmount = await exchange.getBuyTokenAmount(stableTokenAmountToSell, false)
        logger.debug(
          { rate: goldAmount.toString(), stabletoken: stableToken },
          `quote selling ${stableToken}`
        )

        const approveTx = await stableTokenInstance
          .approve(exchange.address, stableTokenAmountToSell.toString())
          .send()
        await approveTx.waitReceipt()
        const sellTx = await exchange
          .sell(
            stableTokenAmountToSell,
            // Allow 5% deviation from the quoted price
            goldAmount.times(0.95).integerValue(BigNumber.ROUND_DOWN).toString(),
            false
          )
          .send()
        await sellTx.getHash()
        const receipt = await sellTx.waitReceipt()
        logger.debug({ stabletoken: stableToken, receipt }, `Sold ${stableToken}`)

        const goldAmountToSell = (await goldToken.balanceOf(from.address)).minus(
          previousGoldBalance
        )

        logger.debug(
          {
            goldAmount: goldAmount.toString(),
            goldAmountToSell: goldAmountToSell.toString(),
            stabletoken: stableToken,
          },
          'Loss to exchange'
        )

        const approveGoldTx = await goldToken
          .approve(exchange.address, goldAmountToSell.toString())
          .send()
        await approveGoldTx.waitReceipt()
        await sleep(5000)
        const sellGoldTx = await exchange
          .sellGold(
            goldAmountToSell,
            // Assume we can get at least 80 % back
            stableTokenAmountToSell.times(0.8).integerValue(BigNumber.ROUND_DOWN).toString()
          )
          .send()
        const sellGoldReceipt = await sellGoldTx.waitReceipt()

        logger.debug({ stabletoken: stableToken, receipt: sellGoldReceipt }, 'Sold CELO')
      })
    }
  })
}
