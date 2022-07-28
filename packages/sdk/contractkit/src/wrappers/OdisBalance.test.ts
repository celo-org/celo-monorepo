import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { StableToken } from '../celo-tokens'
import { newKitFromWeb3 } from '../kit'
import { OdisBalanceWrapper } from './OdisBalance'
import { StableTokenWrapper } from './StableTokenWrapper'

testWithGanache('OdisBalance Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let odisBalance: OdisBalanceWrapper
  let stableToken: StableTokenWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    odisBalance = await kit.contracts.getOdisBalance()
    stableToken = await kit.contracts.getStableToken(StableToken.cUSD)
  })

  describe('#payInCUSD', () => {
    const testValue = 10000

    const payAndCheckState = async (sender: string, receiver: string, transferValue: number) => {
      // Approve cUSD that OdisBalance contract may transfer from sender
      const approveTx = await stableToken
        .approve(odisBalance.address, transferValue)
        .send({ from: sender })
      await approveTx.waitReceipt()

      const senderBalanceBefore = await stableToken.balanceOf(sender)
      const tx = await odisBalance.payInCUSD(receiver, transferValue).send({ from: sender })
      await tx.waitReceipt()
      const balanceAfter = await stableToken.balanceOf(sender)
      expect(senderBalanceBefore.minus(balanceAfter)).toEqBigNumber(transferValue)
      expect(await stableToken.balanceOf(odisBalance.address)).toEqBigNumber(transferValue)
      expect(await odisBalance.totalPaidCUSD(receiver)).toEqBigNumber(transferValue)
    }

    it('should allow sender to make a payment on their behalf', async () => {
      await payAndCheckState(accounts[0], accounts[0], testValue)
    })

    it('should allow sender to make a payment for another account', async () => {
      await payAndCheckState(accounts[0], accounts[1], testValue)
    })

    it('should revert if transfer fails', async () => {
      const approveTx = await stableToken.approve(odisBalance.address, testValue).send()
      await approveTx.waitReceipt()
      expect.assertions(2)
      await expect(odisBalance.payInCUSD(accounts[0], testValue + 1).send()).rejects.toThrow()
      expect(await odisBalance.totalPaidCUSD(accounts[0])).toEqBigNumber(0)
    })
  })
})
