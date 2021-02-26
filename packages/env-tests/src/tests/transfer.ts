import { describe, expect, test } from '@jest/globals'
import { EnvTestContext } from '../context'
import { fundAccount, getKey, initStableTokenFromRegistry, ONE, TestAccounts } from '../scaffold'

export function runTransfersTest(context: EnvTestContext, stableTokensToTest: string[]) {
  describe('Transfer Test', () => {
    const logger = context.logger.child({ test: 'transfer' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.TransferFrom, ONE.times(10), stableTokensToTest)
    })

    for (const stableToken of stableTokensToTest) {
      test(`transfer ${stableToken}`, async () => {
        const stableTokenInstance = await initStableTokenFromRegistry(stableToken, context.kit)

        const from = await getKey(context.mnemonic, TestAccounts.TransferFrom)
        const to = await getKey(context.mnemonic, TestAccounts.TransferTo)
        context.kit.connection.addAccount(from.privateKey)
        context.kit.connection.addAccount(to.privateKey)
        context.kit.connection.defaultFeeCurrency = stableTokenInstance.address

        const toBalanceBefore = await stableTokenInstance.balanceOf(to.address)
        const fromBalanceBefore = await stableTokenInstance.balanceOf(from.address)
        logger.debug(
          { stableToken: stableToken, balance: toBalanceBefore.toString(), account: to.address },
          `Get ${stableToken} Balance Before`
        )

        const receipt = await stableTokenInstance
          .transfer(to.address, ONE.toString())
          .sendAndWaitForReceipt({ from: from.address })

        logger.debug({ stableToken: stableToken, receipt: receipt }, `Transferred ${stableToken}`)

        const toBalanceAfter = await stableTokenInstance.balanceOf(to.address)
        const fromBalanceAfter = await stableTokenInstance.balanceOf(from.address)
        logger.debug(
          { stableToken: stableToken, balance: toBalanceAfter.toString(), account: to.address },
          `Get ${stableToken} Balance After`
        )

        expect(toBalanceAfter.minus(toBalanceBefore).isEqualTo(ONE)).toBeTruthy()
        //check whether difference of balance of 'from' account before/after is greater than 1 (transfer amount + fee)
        expect(fromBalanceBefore.minus(fromBalanceAfter).isGreaterThan(ONE)).toBeTruthy()
      })
    }
  })
}
