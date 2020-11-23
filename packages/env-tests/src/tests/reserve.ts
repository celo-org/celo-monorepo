import { CeloContract } from '@celo/contractkit'
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import { fundAccount, getKey, ONE, TestAccounts } from '../scaffold'
export function runReserveTest(context: EnvTestContext) {
  describe('Reserve Test', () => {
    const logger = context.logger.child({ test: 'reserve' })
    beforeAll(async () => {
      await fundAccount(context, TestAccounts.ReserveSpender, ONE.times(2))
      await fundAccount(context, TestAccounts.ReserveCustodian, ONE.times(2))
    })

    // TODO: Check if reserve account is authorized
    test('move funds from the Reserve to a custodian and back', async () => {
      const spender = await getKey(context.mnemonic, TestAccounts.ReserveSpender)
      const custodian = await getKey(context.mnemonic, TestAccounts.ReserveCustodian)
      context.kit.addAccount(spender.privateKey)
      context.kit.addAccount(custodian.privateKey)
      const reserve = await context.kit.contracts.getReserve()
      const goldToken = await context.kit.contracts.getGoldToken()

      const spenders = await reserve.getSpenders()
      expect(spenders).toHaveLength(1)
      const spenderMultiSigAddress = spenders[0]

      const custodians = await reserve.getOtherReserveAddresses()
      expect(custodians).toContain(custodian.address)

      const spenderMultiSig = await context.kit.contracts.getMultiSig(spenderMultiSigAddress)
      const isOwner = await spenderMultiSig.isowner(spender.address)
      expect(isOwner).toBeTruthy()

      const reserveValue = await reserve.getReserveGoldBalance()
      // Fetch from contract when added to CK wrapper
      const dailySpendingRatio = 0.05
      const transferRatio = 0.01

      const valueToTransfer = reserveValue
        .times(dailySpendingRatio)
        .times(transferRatio)
        .integerValue(BigNumber.ROUND_DOWN)
      const spenderTx = reserve.transferGold(custodian.address, valueToTransfer.toString())
      const multiSigTx = await spenderMultiSig.submitOrConfirmTransaction(
        reserve.address,
        spenderTx.txo
      )
      logger.debug(
        {
          data: spenderTx.txo.encodeABI(),
          reserve: reserve.address,
          from: spenderMultiSigAddress,
        },
        'submitting via multisig'
      )
      const multiSigTxReceipt = await multiSigTx.sendAndWaitForReceipt({
        from: spender.address,
        feeCurrency: await context.kit.registry.addressFor(CeloContract.StableToken),
      })

      logger.debug({ receipt: multiSigTxReceipt }, 'funds moved to custodian via spender')

      const returnTx = goldToken.transfer(reserve.address, valueToTransfer.toString())
      const returnTxReceipt = await returnTx.sendAndWaitForReceipt({ from: custodian.address })

      logger.debug({ receipt: returnTxReceipt }, 'funds moved back to reserve')
    })
  })
}
