import { Address } from '@celo/connect'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import SortedOraclesABI from '@celo/protocol/build/contracts/SortedOracles.json'
import { CeloContract } from '../base'
import { newKitFromWeb3 } from '../kit'
import {
  newPairWithIdentifier,
  OracleRate,
  PairWithIdentifier,
  ReportTarget,
  SortedOraclesWrapper,
} from './SortedOracles'

const truffleContract = require('@truffle/contract')

// set timeout to 10 seconds
jest.setTimeout(10 * 1000)

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

testWithGanache('SortedOracles Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  const SortedOracles = truffleContract(SortedOraclesABI)
  SortedOracles.setProvider(web3.currentProvider)

  async function reportAsOracles(
    sortedOracles: SortedOraclesWrapper,
    target: ReportTarget,
    oracles: Address[],
    rates: number[] = []
  ): Promise<void> {
    // Create some arbitrary values to report if none were passed in
    if (rates.length === 0) {
      for (const _oracle of oracles) {
        rates.push(Math.random() * 2)
      }
    }

    for (let i = 0; i < rates.length; i++) {
      const tx = await sortedOracles.report(target, rates[i], oracles[i])
      await tx.sendAndWaitForReceipt()
    }
  }

  // Quick setup for conditions when some oracle reports are expired and the rest are not.
  // This assumes that the rates reported can be arbitrary and not a critical piece of the test.
  async function setupExpiredAndNotExpiredReports(
    sortedOracles: SortedOraclesWrapper,
    target: ReportTarget,
    expiredOracles: Address[],
    allOracles: Address[]
  ): Promise<void> {
    const expirySeconds = (await sortedOracles.reportExpirySeconds()).toNumber()
    await reportAsOracles(sortedOracles, target, expiredOracles)
    await timeTravel(expirySeconds + 5, web3)
    const freshOracles = allOracles.filter((o) => !expiredOracles.includes(o))
    await reportAsOracles(sortedOracles, target, freshOracles)
  }

  /**
   * When testing with a custom token pair we can't use the
   * already deployed SortedOracles because that's managed
   * by Governance and we can't execute changes on the contract.
   * To make it easier we'll deploy an new version for use in
   * the tests
   */
  async function newSortedOracles(owner: Address): Promise<SortedOraclesWrapper> {
    const instance = await SortedOracles.new({ from: owner })
    await instance.initialize(NetworkConfig.oracles.reportExpiry, { from: owner })
    return new SortedOraclesWrapper(kit, instance.contract)
  }

  async function addOracleForPair(
    sortedOraclesInstance: SortedOraclesWrapper,
    pair: PairWithIdentifier,
    oracle: Address,
    owner: Address
  ): Promise<void> {
    // @ts-ignore
    const sortedOraclesContract = sortedOraclesInstance.contract
    await sortedOraclesContract.methods.addOracle(pair.identifier, oracle).send({
      from: owner,
    })
  }

  // NOTE: These values are set in test-utils/network-config.json, and are derived
  // from the MNEMONIC. If the MNEMONIC has changed, these will need to be reset.
  // To do that, look at the output of web3.eth.getAccounts(), and pick a few
  // addresses from that set to be oracles
  const stableTokenOracles: Address[] = NetworkConfig.stableToken.oracles
  // Use same oracle addresses for CELO/BTC as well
  const celoBtcOracles: Address[] = NetworkConfig.stableToken.oracles
  const oracleAddress = stableTokenOracles[stableTokenOracles.length - 1]

  const celoBtcPair = newPairWithIdentifier('CELO/BTC')
  let stableTokenSortedOracles: SortedOraclesWrapper
  let btcSortedOracles: SortedOraclesWrapper

  let allAccounts: Address[]
  let stableTokenAddress: Address
  let nonOracleAddress: Address
  let btcOracleOwner: Address

  beforeAll(async () => {
    allAccounts = await web3.eth.getAccounts()

    btcOracleOwner = allAccounts[0]
    btcSortedOracles = await newSortedOracles(btcOracleOwner)
    stableTokenSortedOracles = await kit.contracts.getSortedOracles()
    stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)

    // For StableToken the oracles are setup in migrations, for our
    // custom CELO/BTC oracle we need to add them manually
    for (const oracle of celoBtcOracles) {
      await addOracleForPair(btcSortedOracles, celoBtcPair, oracle, btcOracleOwner)
    }

    nonOracleAddress = allAccounts.find((addr) => {
      return !stableTokenOracles.includes(addr)
    })!
  })

  describe('reporting for the cUSD StableToken', () => {
    let sortedOracles: SortedOraclesWrapper
    beforeEach(() => (sortedOracles = stableTokenSortedOracles))

    describe('#report', () => {
      const value = 16

      describe('when reporting from a whitelisted Oracle', () => {
        it('should be able to report a rate', async () => {
          const initialRates: OracleRate[] = await sortedOracles.getRates(CeloContract.StableToken)

          const tx = await sortedOracles.report(CeloContract.StableToken, value, oracleAddress)
          await tx.sendAndWaitForReceipt()

          const resultingRates: OracleRate[] = await sortedOracles.getRates(
            CeloContract.StableToken
          )
          expect(resultingRates).not.toMatchObject(initialRates)
        })

        describe('when inserting into the middle of the existing rates', () => {
          beforeEach(async () => {
            const rates = [15, 20, 17]
            await reportAsOracles(
              sortedOracles,
              CeloContract.StableToken,
              stableTokenOracles,
              rates
            )
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
            const tx = await sortedOracles.report(CeloContract.StableToken, value, oracleAddress)
            const actualArgs = tx.txo.arguments
            expect(actualArgs[2]).toEqual(expectedLesserKey)
            expect(actualArgs[3]).toEqual(expectedGreaterKey)

            await tx.sendAndWaitForReceipt()
          })

          it('inserts the new record in the right place', async () => {
            const tx = await sortedOracles.report(CeloContract.StableToken, value, oracleAddress)
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
          const tx = await sortedOracles.report(CeloContract.StableToken, value, nonOracleAddress)
          await expect(tx.sendAndWaitForReceipt()).rejects.toThrow('sender was not an oracle')
        })

        it('should not change the list of rates', async () => {
          const initialRates = await sortedOracles.getRates(CeloContract.StableToken)
          try {
            const tx = await sortedOracles.report(CeloContract.StableToken, value, nonOracleAddress)
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

    describe('#removeExpiredReports', () => {
      describe('when expired reports exist', () => {
        const expiredOracles = stableTokenOracles.slice(0, 2)
        let initialReportCount: number

        beforeEach(async () => {
          await setupExpiredAndNotExpiredReports(
            sortedOracles,
            CeloContract.StableToken,
            expiredOracles,
            stableTokenOracles
          )
          initialReportCount = await sortedOracles.numRates(CeloContract.StableToken)
        })

        it('should successfully remove a report', async () => {
          const tx = await sortedOracles.removeExpiredReports(CeloContract.StableToken, 1)
          await tx.sendAndWaitForReceipt({ from: oracleAddress })

          expect(await sortedOracles.numRates(CeloContract.StableToken)).toEqual(
            initialReportCount - 1
          )
        })

        it('removes only the expired reports, even if the number to remove is higher', async () => {
          const toRemove = expiredOracles.length + 1
          const tx = await sortedOracles.removeExpiredReports(CeloContract.StableToken, toRemove)
          await tx.sendAndWaitForReceipt({ from: oracleAddress })

          expect(await sortedOracles.numRates(CeloContract.StableToken)).toEqual(
            initialReportCount - expiredOracles.length
          )
        })
      })

      it('should not remove any reports when reports exist but are not expired', async () => {
        await reportAsOracles(sortedOracles, CeloContract.StableToken, stableTokenOracles)

        const initialReportCount = await sortedOracles.numRates(CeloContract.StableToken)

        const tx = await sortedOracles.removeExpiredReports(CeloContract.StableToken, 1)
        await tx.sendAndWaitForReceipt({ from: oracleAddress })

        expect(await sortedOracles.numRates(CeloContract.StableToken)).toEqual(initialReportCount)
      })
    })

    describe('#isOldestReportExpired', () => {
      describe('when at least one expired report exists', () => {
        it('returns with true and the address of the last reporting oracle', async () => {
          await setupExpiredAndNotExpiredReports(
            sortedOracles,
            CeloContract.StableToken,
            [oracleAddress],
            stableTokenOracles
          )
          const [isExpired, address] = await sortedOracles.isOldestReportExpired(
            CeloContract.StableToken
          )
          expect(isExpired).toEqual(true)
          expect(address).toEqual(oracleAddress)
        })
      })
      describe('when the oldest is not expired', () => {
        it('returns with false and the address of the last reporting oracle', async () => {
          await reportAsOracles(sortedOracles, CeloContract.StableToken, stableTokenOracles)
          const [isExpired, address] = await sortedOracles.isOldestReportExpired(
            CeloContract.StableToken
          )
          expect(isExpired).toEqual(false)
          expect(address).toEqual(stableTokenOracles[0])
        })
      })
    })

    /**
     * Proxy Calls to view methods
     *
     * The purpose of these tests is to verify that these wrapper functions exist,
     * are calling the contract methods correctly, and get some value back. The
     * values checked here are often dependent on setup occuring in the protocol
     * migrations run in `yarn test:reset`. If these tests are failing, the first
     * thing to check is if there have been changes to the migrations
     */
    describe('#getRates', () => {
      const expectedRates = [2, 1.5, 1, 0.5]
      beforeEach(async () => {
        await reportAsOracles(
          sortedOracles,
          CeloContract.StableToken,
          stableTokenOracles,
          expectedRates
        )
      })
      it('SBAT getRates', async () => {
        const actualRates = await sortedOracles.getRates(CeloContract.StableToken)
        expect(actualRates.length).toBeGreaterThan(0)
        for (const rate of actualRates) {
          expect(rate).toHaveProperty('address')
          expect(rate).toHaveProperty('rate')
          expect(rate).toHaveProperty('medianRelation')
        }
      })

      it('returns the correct rate', async () => {
        const response = await sortedOracles.getRates(CeloContract.StableToken)
        const actualRates = response.map((r) => r.rate.toNumber())
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
        expect(returnedMedian.rate).toEqBigNumber(NetworkConfig.stableToken.goldPrice)
      })
    })

    describe('#reportExpirySeconds', () => {
      it('returns the number of seconds after which a report expires', async () => {
        const result = await sortedOracles.reportExpirySeconds()
        expect(result).toEqBigNumber(NetworkConfig.oracles.reportExpiry)
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
        const tx = await sortedOracles.reportStableToken(14, oracleAddress)
        await tx.sendAndWaitForReceipt()
        expect(tx.txo.arguments[0]).toEqual(stableTokenAddress)
      })
    })
  })

  describe('reporting for a custom token pair (CELO/BTC)', () => {
    let sortedOracles: SortedOraclesWrapper
    beforeEach(() => (sortedOracles = btcSortedOracles))

    describe('#report', () => {
      const value = 16
      describe('when reporting from a whitelisted Oracle', () => {
        it('should be able to report a rate', async () => {
          const initialRates: OracleRate[] = await sortedOracles.getRates(celoBtcPair)

          const tx = await sortedOracles.report(celoBtcPair, value, oracleAddress)
          await tx.sendAndWaitForReceipt()

          const resultingRates: OracleRate[] = await sortedOracles.getRates(celoBtcPair)
          expect(resultingRates).not.toMatchObject(initialRates)
        })
      })

      describe('when reporting from a non-oracle address', () => {
        it('should raise an error', async () => {
          const tx = await sortedOracles.report(celoBtcPair, value, nonOracleAddress)
          await expect(tx.sendAndWaitForReceipt()).rejects.toThrow('sender was not an oracle')
        })
      })
    })

    describe('#removeExpiredReports', () => {
      describe('when expired reports exist', () => {
        let expiredOracles: Address[]
        let initialReportCount: number

        beforeEach(async () => {
          expiredOracles = celoBtcOracles.slice(0, 2)
          await setupExpiredAndNotExpiredReports(
            sortedOracles,
            celoBtcPair,
            expiredOracles,
            celoBtcOracles
          )
          initialReportCount = await sortedOracles.numRates(celoBtcPair)
        })

        it('should successfully remove a report', async () => {
          const tx = await sortedOracles.removeExpiredReports(celoBtcPair, 1)
          await tx.sendAndWaitForReceipt({ from: oracleAddress })

          expect(await sortedOracles.numRates(celoBtcPair)).toEqual(initialReportCount - 1)
        })
      })
    })

    /**
     * Proxy Calls to view methods
     *
     * The purpose of these tests is to verify that these wrapper functions exist,
     * are calling the contract methods correctly, and get some value back. The
     * values checked here are often dependent on setup occuring in the protocol
     * migrations run in `yarn test:reset`. If these tests are failing, the first
     * thing to check is if there have been changes to the migrations
     */
    describe('#getRates', () => {
      const expectedRates = [2, 1.5, 1, 0.5]

      beforeEach(async () => {
        await reportAsOracles(sortedOracles, celoBtcPair, celoBtcOracles, expectedRates)
      })

      it('SBAT getRates', async () => {
        const actualRates = await sortedOracles.getRates(celoBtcPair)
        expect(actualRates.length).toBeGreaterThan(0)
        for (const rate of actualRates) {
          expect(rate).toHaveProperty('address')
          expect(rate).toHaveProperty('rate')
          expect(rate).toHaveProperty('medianRelation')
        }
      })

      it('returns the correct rate', async () => {
        const response = await sortedOracles.getRates(celoBtcPair)
        const actualRates = response.map((r) => r.rate.toNumber())
        expect(actualRates).toEqual(expectedRates)
      })
    })

    describe('#isOracle', () => {
      it('returns true when this address is a whitelisted oracle for this token', async () => {
        expect(await sortedOracles.isOracle(celoBtcPair, oracleAddress)).toEqual(true)
      })
      it('returns false when this address is not an oracle', async () => {
        expect(await sortedOracles.isOracle(celoBtcPair, nonOracleAddress)).toEqual(false)
      })
    })
  })
})
