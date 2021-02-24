import { describe, expect, test } from '@jest/globals'
import { EnvTestContext } from '../context'
import { fundAccount, getKey, initStableTokenFromRegistry, ONE, TestAccounts } from '../scaffold'

export function runTransfersTest(context: EnvTestContext) {
  describe('Transfer Test', () => {
    const logger = context.logger.child({ test: 'transfer' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.TransferFrom, ONE.times(10))
    })

    for (const stableToken of context.stableTokensToTest) {
      test(`transfer ${stableToken}`, async () => {
        let stableTokenInstance = await initStableTokenFromRegistry(stableToken, context)

        const from = await getKey(context.mnemonic, TestAccounts.TransferFrom)
        const to = await getKey(context.mnemonic, TestAccounts.TransferTo)
        context.kit.connection.addAccount(from.privateKey)
        context.kit.connection.addAccount(to.privateKey)
        context.kit.connection.defaultFeeCurrency = stableTokenInstance.address

        const toBalanceBefore = await stableTokenInstance.balanceOf(to.address)
        logger.debug(
          {
            balance: toBalanceBefore.toString(),
            account: to.address,
          },
          'Get Balance Before'
        )

        const receipt = await stableTokenInstance
          .transfer(to.address, ONE.toString())
          .sendAndWaitForReceipt({ from: from.address })

        logger.debug({ receipt }, 'Transferred')

        const toBalanceAfter = await stableTokenInstance.balanceOf(to.address)
        logger.debug(
          {
            balance: toBalanceAfter.toString(),
            account: to.address,
          },
          'Get Balance After'
        )

        expect(toBalanceAfter.minus(toBalanceBefore).isEqualTo(ONE)).toBeTruthy()
      })
    }
  })
}
