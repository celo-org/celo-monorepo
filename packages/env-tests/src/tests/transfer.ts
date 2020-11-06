import { describe, expect, test } from '@jest/globals'
import { Context } from '../context'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'

export function runTransfercUSDTest(context: Context) {
  describe('Transfer Test', () => {
    const logger = context.logger.child({ test: 'transfer' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.TransferFrom, ONE.times(10))
    })

    test('transfer cUSD', async () => {
      const from = await getKey(context.mnemonic, TestAccounts.TransferFrom)
      const to = await getKey(context.mnemonic, TestAccounts.TransferTo)
      context.kit.addAccount(from.privateKey)
      context.kit.addAccount(to.privateKey)
      const stableToken = await context.kit.contracts.getStableToken()
      context.kit.defaultFeeCurrency = stableToken.address

      const toBalanceBefore = await stableToken.balanceOf(to.address)
      logger.debug('Get Balance Before', {
        balance: toBalanceBefore.toString(),
        account: to.address,
      })

      const receipt = await stableToken
        .transfer(to.address, ONE.toString())
        .sendAndWaitForReceipt({ from: from.address })

      logger.debug('Transferred', { receipt })

      const toBalanceAfter = await stableToken.balanceOf(to.address)
      logger.debug('Get Balance After', {
        balance: toBalanceAfter.toString(),
        account: to.address,
      })

      expect(toBalanceAfter.minus(toBalanceBefore).isEqualTo(ONE)).toBeTruthy()
    })
  })
}
