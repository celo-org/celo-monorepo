import { ContractKit } from '@celo/contractkit'
import { describe, expect, test } from '@jest/globals'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'

export function runTransfercUSDTest(kit: ContractKit, fundingMnemonic: string) {
  describe('Transfer Test', () => {
    beforeAll(async () => {
      await fundAccount(kit, fundingMnemonic, TestAccounts.TransferFrom, ONE.times(2))
    })

    test('transfer cUSD', async () => {
      const from = await getKey(fundingMnemonic, TestAccounts.TransferFrom)
      const to = await getKey(fundingMnemonic, TestAccounts.TransferTo)
      kit.addAccount(from.privateKey)
      kit.addAccount(to.privateKey)
      const stableToken = await kit.contracts.getStableToken()
      kit.defaultFeeCurrency = stableToken.address

      const toBalanceBefore = await stableToken.balanceOf(to.address)

      await stableToken
        .transfer(to.address, ONE.toString())
        .sendAndWaitForReceipt({ from: from.address })

      const toBalanceAfter = await stableToken.balanceOf(to.address)

      expect(toBalanceAfter.minus(toBalanceBefore).isEqualTo(ONE)).toBeTruthy()
    })
  })
}
