// import { sleep } from '@celo/base'
import { describe, test } from '@jest/globals'
// import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import {
  fundAccountWithCELO,
  fundAccountWithStableToken,
  getKey,
  // initExchangeFromRegistry,
  // initStableTokenFromRegistry,
  ONE,
  TestAccounts,
} from '../scaffold'

export function runGrandaMentoTest(context: EnvTestContext, stableTokensToTest: string[]) {
  const celoAmountToFund = ONE
  const stableTokenAmountToFund = ONE
  describe('Granda Mento Test', () => {
    beforeAll(async () => {
      await fundAccountWithCELO(context, TestAccounts.GrandaMentoExchanger, celoAmountToFund)
    })

    const logger = context.logger.child({ test: 'grandaMento' })

    for (const sellCelo of [/*true, */ false]) {
      for (const stableToken of stableTokensToTest) {
        const sellTokenStr = sellCelo ? 'CELO' : stableToken
        const buyTokenStr = sellCelo ? stableToken : 'CELO'
        describe(`selling ${sellTokenStr} for ${buyTokenStr}`, () => {
          beforeAll(async () => {
            if (!sellCelo) {
              await fundAccountWithStableToken(
                context,
                TestAccounts.GrandaMentoExchanger,
                stableTokenAmountToFund,
                stableToken
              )
            }
          })

          test('exchanger creates and cancels an exchange proposal', async () => {
            // const stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)
            const from = await getKey(context.mnemonic, TestAccounts.GrandaMentoExchanger)
            context.kit.connection.addAccount(from.privateKey)
            context.kit.defaultAccount = from.address

            logger.info('from balance', await context.kit.getTotalBalance(from.address))

            // const creationReceipt = await
          })
        })

        //
        //   test(`exchange ${stableToken} for CELO`, async () => {
        //     const stableTokenAmountToFund = ONE
        //     await fundAccountWithStableToken(
        //       context,
        //       TestAccounts.Exchange,
        //       stableTokenAmountToFund,
        //       stableToken
        //     )
        //     const stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)
        //
        //     const from = await getKey(context.mnemonic, TestAccounts.Exchange)
        //     context.kit.connection.addAccount(from.privateKey)
        //     context.kit.defaultAccount = from.address
        //     context.kit.connection.defaultFeeCurrency = stableTokenInstance.address
        //     const goldToken = await context.kit.contracts.getGoldToken()
        //
        //     const exchange = await initExchangeFromRegistry(stableToken, context.kit)
        //     const previousGoldBalance = await goldToken.balanceOf(from.address)
        //     const stableTokenAmountToSell = stableTokenAmountToFund.times(0.5)
        //     const goldAmount = await exchange.getBuyTokenAmount(stableTokenAmountToSell, false)
        //     logger.debug(
        //       { rate: goldAmount.toString(), stabletoken: stableToken },
        //       `quote selling ${stableToken}`
        //     )
        //
        //     const approveTx = await stableTokenInstance
        //       .approve(exchange.address, stableTokenAmountToSell.toString())
        //       .send()
        //     await approveTx.waitReceipt()
        //     const sellTx = await exchange
        //       .sell(
        //         stableTokenAmountToSell,
        //         // Allow 5% deviation from the quoted price
        //         goldAmount.times(0.95).integerValue(BigNumber.ROUND_DOWN).toString(),
        //         false
        //       )
        //       .send()
        //     await sellTx.getHash()
        //     const receipt = await sellTx.waitReceipt()
        //     logger.debug({ stabletoken: stableToken, receipt }, `Sold ${stableToken}`)
        //
        //     const goldAmountToSell = (await goldToken.balanceOf(from.address)).minus(
        //       previousGoldBalance
        //     )
        //
        //     logger.debug(
        //       {
        //         goldAmount: goldAmount.toString(),
        //         goldAmountToSell: goldAmountToSell.toString(),
        //         stabletoken: stableToken,
        //       },
        //       'Loss to exchange'
        //     )
        //
        //     const approveGoldTx = await goldToken
        //       .approve(exchange.address, goldAmountToSell.toString())
        //       .send()
        //     await approveGoldTx.waitReceipt()
        //     await sleep(5000)
        //     const sellGoldTx = await exchange
        //       .sellGold(
        //         goldAmountToSell,
        //         // Assume we can get at least 80 % back
        //         stableTokenAmountToSell.times(0.8).integerValue(BigNumber.ROUND_DOWN).toString()
        //       )
        //       .send()
        //     const sellGoldReceipt = await sellGoldTx.waitReceipt()
        //
        //     logger.debug({ stabletoken: stableToken, receipt: sellGoldReceipt }, 'Sold CELO')
        //   })
      }
    }
  })
}
