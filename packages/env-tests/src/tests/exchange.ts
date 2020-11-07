import { ContractKit } from '@celo/contractkit'
import { describe, test } from '@jest/globals'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'

export function runExchangeTest(kit: ContractKit, fundingMnemonic: string) {
  describe('Exchange Test', () => {
    beforeAll(async () => {
      await fundAccount(kit, fundingMnemonic, TestAccounts.Exchange, ONE.times(2))
    })

    test('exchange cUSD for CELO', async () => {
      const from = await getKey(fundingMnemonic, TestAccounts.Exchange)
      kit.addAccount(from.privateKey)
      kit.defaultAccount = from.address
      const stableToken = await kit.contracts.getStableToken()
      const exchange = await kit.contracts.getExchange()

      const goldAmount = await exchange.quoteUsdSell(ONE)
      const approveTx = await stableToken.approve(exchange.address, ONE.toString()).send()
      await approveTx.waitReceipt()
      const sellTx = await exchange.sellDollar(ONE, goldAmount).send()
      await sellTx.waitReceipt()
    })
  })
}
