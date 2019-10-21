import { Address, CeloContract } from '../base'
import { newKitFromWeb3 } from '../kit'
import { NetworkConfig, testWithGanache } from '../test-utils/ganache-test'
import { OracleRate, SortedOraclesWrapper } from './SortedOracles'

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

testWithGanache('SortedOracles Wrapper', (web3) => {
  // NOTE: These values are set in test-utils/network-config.json, and are derived
  // from the MNEMONIC. If the MNEMONIC has changed, these will need to be reset.
  // To do that, look at the output of web3.eth.getAccounts(), and pick a few
  // addresses from that set to be oracles
  const stableTokenOracles: Address[] = NetworkConfig.stableToken.priceOracleAccounts
  const oracleAddress = stableTokenOracles[stableTokenOracles.length - 1]

  const kit = newKitFromWeb3(web3)
  let allAccounts: Address[]
  let sortedOracles: SortedOraclesWrapper
  let stableTokenAddress: Address
  let nonOracleAddress: Address

  beforeAll(async () => {
    sortedOracles = await kit.contracts.getSortedOracles()
    stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
    allAccounts = await web3.eth.getAccounts()
    nonOracleAddress = allAccounts.find((addr) => {
      return !stableTokenOracles.includes(addr)
    })!
  })

  describe('#report', () => {
    const numerator = 16
    const denominator = 1

    describe('when reporting from a whitelisted Oracle', () => {
      it('should be able to report a rate', async () => {
        const initialRates: OracleRate[] = await sortedOracles.getRates(CeloContract.StableToken)

        const tx = await sortedOracles.report(
          CeloContract.StableToken,
          numerator,
          denominator,
          oracleAddress
        )
        await tx.sendAndWaitForReceipt()

        const resultingRates: OracleRate[] = await sortedOracles.getRates(CeloContract.StableToken)
        expect(resultingRates).not.toMatchObject(initialRates)
      })

      describe('when inserting into the middle of the existing rates', () => {
        beforeEach(async () => {
          const rates = [15, 20, 17]
          for (let i = 0; i < stableTokenOracles.length - 1; i++) {
            const tx = await sortedOracles.report(
              CeloContract.StableToken,
              rates[i],
              denominator,
              stableTokenOracles[i]
            )
            await tx.sendAndWaitForReceipt()
          }
        })

        const expectedLesserKey = stableTokenOracles[0]
        const expectedGreaterKey = stableTokenOracles[2]

        const expectedOracleOrder = [
          stableTokenOracles[1],
          stableTokenOracles[2],
          oracleAddress,
          stableTokenOracles[0],
        ]

        it('passes the correct lesserKey and greaterKey as args', async () => {
          const tx = await sortedOracles.report(
            CeloContract.StableToken,
            numerator,
            denominator,
            oracleAddress
          )
          const actualArgs = tx.txo.arguments
          expect(actualArgs[3]).toEqual(expectedLesserKey)
          expect(actualArgs[4]).toEqual(expectedGreaterKey)

          await tx.sendAndWaitForReceipt()
        })

        it('inserts the new record in the right place', async () => {
          const tx = await sortedOracles.report(
            CeloContract.StableToken,
            numerator,
            denominator,
            oracleAddress
          )
          await tx.sendAndWaitForReceipt()

          const resultingRates: OracleRate[] = await sortedOracles.getRates(
            CeloContract.StableToken
          )

          expect(resultingRates.map((r) => r.address)).toEqual(expectedOracleOrder)
        })
      })
    })

    describe('when reporting from a non-oracle address', () => {
      it('should raise an error', async () => {
        const tx = await sortedOracles.report(
          CeloContract.StableToken,
          numerator,
          denominator,
          nonOracleAddress
        )
        await expect(tx.sendAndWaitForReceipt()).rejects.toThrow('sender was not an oracle')
      })

      it('should not change the list of rates', async () => {
        const initialRates = await sortedOracles.getRates(CeloContract.StableToken)
        try {
          const tx = await sortedOracles.report(
            CeloContract.StableToken,
            numerator,
            denominator,
            nonOracleAddress
          )
          await tx.sendAndWaitForReceipt()
        } catch (err) {
          // We don't need to do anything with this error other than catch it so
          // it doesn't fail this test.
        } finally {
          const resultingRates = await sortedOracles.getRates(CeloContract.StableToken)
          expect(resultingRates).toMatchObject(initialRates)
        }
      })
    })
  })

  /**
   * Proxy Calls to view methods
   *
   * The purpose of these tests is to verify that these wrapper functions exist,
   * are calling the contract methods correctly, and get some value back. The
   * values checked here are often dependent on setup occuring in the protocol
   * migrations run in `yarn test:prepare`. If these tests are failing, the first
   * thing to check is if there have been changes to the migrations
   */
  describe('#getRates', () => {
    beforeEach(async () => {
      for (let i = 0; i < stableTokenOracles.length; i++) {
        // reports these values:
        // 1/2, 2/2, 3/2, 4/2
        // resulting in: 0.5, 1, 1.5, 2
        const tx = await sortedOracles.report(
          CeloContract.StableToken,
          i + 1,
          2,
          stableTokenOracles[i]
        )
        await tx.sendAndWaitForReceipt()
      }
    })
    it('SBAT getRates', async () => {
      const rates = await sortedOracles.getRates(CeloContract.StableToken)
      expect(rates.length).toBeGreaterThan(0)
      for (const rate of rates) {
        expect(rate).toHaveProperty('address')
        expect(rate).toHaveProperty('rate')
        expect(rate).toHaveProperty('medianRelation')
      }
    })

    it('returns the rate as the result of the calculation numerator/denominator', async () => {
      const expectedRates = ['2', '1.5', '1', '0.5']
      const response = await sortedOracles.getRates(CeloContract.StableToken)
      const actualRates = response.map((r) => r.rate.toString())
      expect(actualRates).toEqual(expectedRates)
    })
  })

  describe('#isOracle', () => {
    it('returns true when this address is a whitelisted oracle for this token', async () => {
      expect(await sortedOracles.isOracle(CeloContract.StableToken, oracleAddress)).toEqual(true)
    })
    it('returns false when this address is not an oracle', async () => {
      expect(await sortedOracles.isOracle(CeloContract.StableToken, nonOracleAddress)).toEqual(
        false
      )
    })
  })

  describe('#numRates', () => {
    it('returns a count of rates reported for the specified token', async () => {
      // Why 1? In packages/protocol/08_stabletoken, a single rate is reported
      expect(await sortedOracles.numRates(CeloContract.StableToken)).toEqBigNumber(1)
    })
  })

  describe('#medianRate', () => {
    it('returns the key for the median', async () => {
      const returnedMedian = await sortedOracles.medianRate(CeloContract.StableToken)
      // The value `10` comes from: packages/protocol/migrationsConfig.js:
      //   stableToken.goldPrice
      expect(returnedMedian.rate).toEqBigNumber(10)
    })
  })

  describe('#reportExpirySeconds', () => {
    it('returns the number of seconds after which a report expires', async () => {
      const result = await sortedOracles.reportExpirySeconds()
      expect(result).toEqBigNumber(3600)
    })
  })

  /**
   * Helper Functions
   *
   * These are functions in the wrapper that call other functions, passing in
   * some regularly used arguments. The purpose of these tests is to verify that
   * those arguments are being set correctly.
   */
  describe('getStableTokenRates', () => {
    it('gets rates for Stable Token', async () => {
      const usdRatesResult = await sortedOracles.getStableTokenRates()
      const getRatesResult = await sortedOracles.getRates(CeloContract.StableToken)
      expect(usdRatesResult).toEqual(getRatesResult)
    })
  })

  describe('reportStableToken', () => {
    it('calls report with the address for StableToken', async () => {
      const tx = await sortedOracles.reportStableToken(14, 1, oracleAddress)
      await tx.sendAndWaitForReceipt()
      expect(tx.txo.arguments[0]).toEqual(stableTokenAddress)
    })
  })
})
