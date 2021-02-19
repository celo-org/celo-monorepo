import { sleep } from '@celo/base'
import { CeloContract } from '@celo/contractkit'
import { newStableToken } from '@celo/contractkit/lib/generated/StableToken'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'

export function runExchangeTest(context: EnvTestContext) {
  describe('Exchange Test', () => {
    const logger = context.logger.child({ test: 'exchange' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.Exchange, ONE.times(10))
    })

    const stableTokensToTest = context.stableTokensToTest

    for (const [stableToken, stableTokenRegistryName] of stableTokensToTest) {
      test(`exchange ${stableToken} for CELO`, async () => {
        let stableTokenAddress = await context.kit.registry.addressFor(
          stableTokenRegistryName as CeloContract
        )
        let stableTokenContract = newStableToken(context.kit.web3, stableTokenAddress)
        let stableTokenInstance = new StableTokenWrapper(context.kit, stableTokenContract)

        const from = await getKey(context.mnemonic, TestAccounts.Exchange)
        context.kit.connection.addAccount(from.privateKey)
        context.kit.defaultAccount = from.address
        //const stableTokenInstance = await context.kit.contracts.getStableToken()
        context.kit.connection.defaultFeeCurrency = stableTokenInstance.address
        const goldToken = await context.kit.contracts.getGoldToken()
        const exchange = await context.kit.contracts.getExchange()

        const previousGoldBalance = await goldToken.balanceOf(from.address)
        const goldAmount = await exchange.getBuyTokenAmount(ONE, false)
        logger.debug({ rate: goldAmount.toString() }, `quote selling ${stableToken}`)

        const approveTx = await stableTokenInstance.approve(exchange.address, ONE.toString()).send()
        await approveTx.waitReceipt()
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
        await sellTx.getHash()
        const receipt = await sellTx.waitReceipt()

        logger.debug({ receipt }, `Sold ${stableToken}`)

        // Sell more to receive at least 1 cUSD / cEUR back
        const goldAmountToSell = (await goldToken.balanceOf(from.address)).minus(
          previousGoldBalance
        )

        logger.debug(
          {
            goldAmount: goldAmount.toString(),
            goldAmountToSell: goldAmountToSell.toString(),
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
            // Assume wee can get at least 80 cents back
            ONE.times(0.8)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString()
          )
          .send()
        const sellGoldReceipt = await sellGoldTx.waitReceipt()

        logger.debug({ receipt: sellGoldReceipt }, 'Sold CELO')
      })
    }
  })
}
