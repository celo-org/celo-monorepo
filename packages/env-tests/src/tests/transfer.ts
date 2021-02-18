import { describe, expect, test } from '@jest/globals'
import { EnvTestContext } from '../context'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'
import { CeloContract } from '@celo/contractkit'
import { newStableToken } from '@celo/contractkit/lib/generated/StableToken'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'

export function runTransfercUSDTest(context: EnvTestContext) {
  describe('Transfer Test', () => {
    const logger = context.logger.child({ test: 'transfer' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.TransferFrom, ONE.times(10))
    })

    const stableTokensToTest: [string, string][] = [
      ['cUSD', 'StableToken'],
      // ['cEUR', 'StableTokenEUR'],
    ]

    for (const [stableToken, stableTokenRegistryName] of stableTokensToTest) {
      test(`transfer ${stableToken}`, async () => {
        let stableTokenAddress = await context.kit.registry.addressFor(
          stableTokenRegistryName as CeloContract
        )
        let stableTokenContract = newStableToken(context.kit.web3, stableTokenAddress)
        let stableTokenWrapper = new StableTokenWrapper(context.kit, stableTokenContract)

        const from = await getKey(context.mnemonic, TestAccounts.TransferFrom)
        const to = await getKey(context.mnemonic, TestAccounts.TransferTo)
        context.kit.connection.addAccount(from.privateKey)
        context.kit.connection.addAccount(to.privateKey)
        context.kit.connection.defaultFeeCurrency = stableTokenWrapper.address

        const toBalanceBefore = await stableTokenWrapper.balanceOf(to.address)
        logger.debug(
          {
            balance: toBalanceBefore.toString(),
            account: to.address,
          },
          'Get Balance Before'
        )

        const receipt = await stableTokenWrapper
          .transfer(to.address, ONE.toString())
          .sendAndWaitForReceipt({ from: from.address })

        logger.debug({ receipt }, 'Transferred')

        const toBalanceAfter = await stableTokenWrapper.balanceOf(to.address)
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
