import { CeloContract } from '@celo/contractkit'
// eslint-disable-next-line  import/no-extraneous-dependencies
import { describe, expect, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import { fundAccountWithcUSD, getKey, ONE, TestAccounts } from '../scaffold'

export function runOracleTest(context: EnvTestContext) {
  describe('Oracle Test', () => {
    const logger = context.logger.child({ test: 'exchange' })
    beforeAll(async () => {
      await fundAccountWithcUSD(context, TestAccounts.Exchange, ONE.times(2))
    })

    // TODO: Check if oracle account is authorized
    test('report a rate', async () => {
      const from = await getKey(context.mnemonic, TestAccounts.Oracle)
      context.kit.connection.addAccount(from.privateKey)
      context.kit.defaultAccount = from.address
      const stableToken = await context.kit.contracts.getStableToken()
      context.kit.defaultFeeCurrency = stableToken.address

      const oracles = await context.kit.contracts.getSortedOracles()

      const isOracle = await oracles.isOracle(CeloContract.StableToken, from.address)

      expect(isOracle).toBeTruthy()

      const oracleRates = await oracles.getReports(CeloContract.StableToken)
      const ourRate = oracleRates.find((_) => _.address === from.address)

      let rateToReport: BigNumber
      if (!ourRate) {
        const currentMedianRate = await oracles.medianRate(CeloContract.StableToken)
        rateToReport = currentMedianRate.rate
        logger.debug(
          {
            rate: currentMedianRate.rate.toString(),
          },
          'no existing rate, using the median'
        )
      } else {
        rateToReport = ourRate.rate
        logger.debug({ rate: ourRate.rate.toString() }, 'fetched existing oracle report')
      }

      // Move the rate in one direction or another
      rateToReport = rateToReport.times(0.95 + Math.random() * 0.1).decimalPlaces(10)

      const reportTx = await oracles.report(CeloContract.StableToken, rateToReport, from.address)
      const reportTxReceipt = await reportTx.sendAndWaitForReceipt({ from: from.address })
      logger.debug({ receipt: reportTxReceipt }, 'rate reported')

      const newOracleRates = await oracles.getReports(CeloContract.StableToken)
      const ourNewRate = newOracleRates.find((_) => _.address === from.address)

      logger.debug({ rate: ourNewRate?.rate.toString() }, 'our new rate')
      expect(ourNewRate?.rate).toEqual(rateToReport)
    })
  })
}
