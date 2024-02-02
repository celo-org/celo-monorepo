import { StableToken } from '@celo/contractkit'
// eslint-disable-next-line  import/no-extraneous-dependencies
import { describe, expect, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import { ONE, TestAccounts, fundAccountWithStableToken, getKey } from '../scaffold'

export function runTransfersTest(context: EnvTestContext, stableTokensToTest: StableToken[]) {
  describe('Transfer Test', () => {
    const logger = context.logger.child({ test: 'transfer' })

    for (const stableToken of stableTokensToTest) {
      test(`transfer ${stableToken}`, async () => {
        const stableTokenAmountToFund = ONE
        await fundAccountWithStableToken(
          context,
          TestAccounts.TransferFrom,
          stableTokenAmountToFund,
          stableToken
        )
        const stableTokenInstance = await context.kit.celoTokens.getWrapper(stableToken)

        const from = await getKey(context.mnemonic, TestAccounts.TransferFrom)
        const to = await getKey(context.mnemonic, TestAccounts.TransferTo)
        context.kit.connection.addAccount(from.privateKey)
        context.kit.connection.addAccount(to.privateKey)
        context.kit.connection.defaultFeeCurrency = stableTokenInstance.address

        const toBalanceBefore = await stableTokenInstance.balanceOf(to.address)
        const fromBalanceBefore = await stableTokenInstance.balanceOf(from.address)
        logger.debug(
          { stabletoken: stableToken, balance: toBalanceBefore.toString(), account: to.address },
          `Get ${stableToken} Balance Before`
        )

        const stableTokenAmountToTransfer = ONE.times(0.5)
        const receipt = await stableTokenInstance
          .transfer(to.address, stableTokenAmountToTransfer.toString())
          .sendAndWaitForReceipt({ from: from.address })

        logger.debug({ stabletoken: stableToken, receipt }, `Transferred ${stableToken}`)
        const transaction = await context.kit.web3.eth.getTransaction(receipt.transactionHash)
        const gasPrice = new BigNumber(transaction.gasPrice)
        const gasUsed = new BigNumber(context.kit.web3.utils.toDecimal(receipt.gasUsed).toString())
        const transactionFee = gasPrice.times(gasUsed)

        const toBalanceAfter = await stableTokenInstance.balanceOf(to.address)
        const fromBalanceAfter = await stableTokenInstance.balanceOf(from.address)
        logger.debug(
          { stabletoken: stableToken, balance: toBalanceAfter.toString(), account: to.address },
          `Get ${stableToken} Balance After`
        )
        expect(
          toBalanceAfter.minus(toBalanceBefore).isEqualTo(stableTokenAmountToTransfer)
        ).toBeTruthy()
        // check whether difference of balance of 'from' account before/after - transfer amount
        // is equal to transaction fee
        expect(
          fromBalanceBefore
            .minus(fromBalanceAfter)
            .minus(stableTokenAmountToTransfer)
            .isEqualTo(transactionFee)
        ).toBeTruthy()
      })
    }
  })
}
