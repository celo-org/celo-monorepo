import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  matchAddress,
  matchAny,
  NULL_ADDRESS,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import { SortedOraclesContract, SortedOraclesInstance } from 'types'
import { toFixed } from '@celo/utils/lib/fixidity'
import { assert } from 'chai'

const SortedOracles: SortedOraclesContract = artifacts.require('SortedOracles')

// @ts-ignore
// TODO(mcortesi): Use BN.js
SortedOracles.numberFormat = 'BigNumber'

contract('SortedOracles', (accounts: string[]) => {
  let sortedOracles: SortedOraclesInstance
  const anOracle = accounts[9]
  const aToken = '0x00000000000000000000000000000000deadbeef'
  const aReportExpiry: number = 3600

  beforeEach(async () => {
    sortedOracles = await SortedOracles.new()
    await sortedOracles.initialize(aReportExpiry)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await sortedOracles.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set reportExpiry', async () => {
      assertEqualBN(await sortedOracles.reportExpirySeconds(), aReportExpiry)
    })

    it('should not be callable again', async () => {
      await assertRevert(sortedOracles.initialize(aReportExpiry))
    })
  })

  describe('#setReportExpiry', () => {
    const newReportExpiry = aReportExpiry + 1

    it('should update reportExpiry', async () => {
      await sortedOracles.setReportExpiry(newReportExpiry)
      assertEqualBN(await sortedOracles.reportExpirySeconds(), newReportExpiry)
    })

    it('should emit the ReportExpirySet event', async () => {
      const resp = await sortedOracles.setReportExpiry(newReportExpiry)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ReportExpirySet',
        args: {
          reportExpiry: new BigNumber(newReportExpiry),
        },
      })
    })

    it('should revert when called by a non-owner', async () => {
      await assertRevert(sortedOracles.setReportExpiry(newReportExpiry, { from: accounts[1] }))
    })
  })

  describe('#addOracle', () => {
    it('should add an Oracle', async () => {
      await sortedOracles.addOracle(aToken, anOracle)
      assert.isTrue(await sortedOracles.isOracle(aToken, anOracle))
    })

    it('should emit the OracleAdded event', async () => {
      const resp = await sortedOracles.addOracle(aToken, anOracle)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'OracleAdded',
        args: {
          token: matchAddress(aToken),
          oracleAddress: matchAddress(anOracle),
        },
      })
    })

    it('should revert when token is the null address', async () => {
      await assertRevert(sortedOracles.addOracle(NULL_ADDRESS, anOracle))
    })

    it('should revert when the oracle is the null address', async () => {
      await assertRevert(sortedOracles.addOracle(aToken, NULL_ADDRESS))
    })

    it('should revert when the oracle has already been added', async () => {
      await sortedOracles.addOracle(aToken, anOracle)
      await assertRevert(sortedOracles.addOracle(aToken, anOracle))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(sortedOracles.addOracle(aToken, anOracle, { from: accounts[1] }))
    })
  })

  describe('#removeExpiredReports', () => {
    beforeEach(async () => {
      await sortedOracles.addOracle(aToken, anOracle)
    })

    it('should revert when no report exists', async () => {
      await assertRevert(sortedOracles.removeExpiredReports(aToken, 1))
    })

    describe('when a report has been made', () => {
      beforeEach(async () => {
        await sortedOracles.report(aToken, new BigNumber(1), NULL_ADDRESS, NULL_ADDRESS, {
          from: anOracle,
        })
      })

      it('should revert when only 1 report exists', async () => {
        await assertRevert(sortedOracles.removeExpiredReports(aToken, 1))
      })

      describe('when multiple reports have been made', () => {
        beforeEach(async () => {
          await timeTravel(aReportExpiry / 2, web3)
          for (let i = 7; i > 3; i--) {
            const anotherOracle = accounts[i]
            await sortedOracles.addOracle(aToken, anotherOracle)
            await sortedOracles.report(aToken, new BigNumber(2), anOracle, NULL_ADDRESS, {
              from: anotherOracle,
            })
          }
        })

        it('should do nothing when oldest report is not expired', async () => {
          await sortedOracles.removeExpiredReports(aToken, 3)
          assert.equal(await sortedOracles.numTimestamps.call(aToken), 5)
        })

        it('should remove k and stop when k<n reports are expired', async () => {
          await timeTravel(aReportExpiry / 2, web3)
          await sortedOracles.removeExpiredReports(aToken, 3)
          assert.equal(await sortedOracles.numTimestamps.call(aToken), 4)
        })

        it('should revert when n>=numTimestamps', async () => {
          await assertRevert(sortedOracles.removeExpiredReports(aToken, 5))
        })

        it('should remove n when n<numTimestamps reports are expired', async () => {
          await timeTravel(aReportExpiry, web3)
          await sortedOracles.removeExpiredReports(aToken, 3)
          assert.equal(await sortedOracles.numTimestamps.call(aToken), 2)
        })
      })
    })
  })

  describe('#removeOracle', () => {
    beforeEach(async () => {
      await sortedOracles.addOracle(aToken, anOracle)
    })

    it('should remove an Oracle', async () => {
      await sortedOracles.removeOracle(aToken, anOracle, 0)
      assert.isFalse(await sortedOracles.isOracle(aToken, anOracle))
    })

    describe('when a report has been made', () => {
      beforeEach(async () => {
        await sortedOracles.report(aToken, new BigNumber(10), NULL_ADDRESS, NULL_ADDRESS, {
          from: anOracle,
        })
      })

      it('should decrease the number of rates', async () => {
        await sortedOracles.removeOracle(aToken, anOracle, 0)
        assert.equal((await sortedOracles.numRates(aToken)).toNumber(), 0)
      })

      it('should reset the median rate', async () => {
        await sortedOracles.removeOracle(aToken, anOracle, 0)
        const [actualMedianRate] = await sortedOracles.medianRate(aToken)
        assert.equal(actualMedianRate.toNumber(), 0)
      })

      it('should decrease the number of timestamps', async () => {
        await sortedOracles.removeOracle(aToken, anOracle, 0)
        assert.equal((await sortedOracles.numTimestamps(aToken)).toNumber(), 0)
      })

      it('should reset the median timestamp', async () => {
        await sortedOracles.removeOracle(aToken, anOracle, 0)
        assert.equal((await sortedOracles.medianTimestamp(aToken)).toNumber(), 0)
      })

      it('should emit the OracleReportRemoved and MedianUpdated events', async () => {
        const resp = await sortedOracles.removeOracle(aToken, anOracle, 0)
        assert.equal(resp.logs.length, 3)
        assertLogMatches2(resp.logs[0], {
          event: 'OracleReportRemoved',
          args: {
            oracle: matchAddress(anOracle),
            token: matchAddress(aToken),
          },
        })

        assertLogMatches2(resp.logs[1], {
          event: 'MedianUpdated',
          args: {
            token: matchAddress(aToken),
            newMedian: new BigNumber(0),
          },
        })

        assertLogMatches2(resp.logs[2], {
          event: 'OracleRemoved',
          args: {
            token: matchAddress(aToken),
            oracleAddress: matchAddress(anOracle),
          },
        })
      })
    })

    it('should emit the OracleRemoved event', async () => {
      const resp = await sortedOracles.removeOracle(aToken, anOracle, 0)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'OracleRemoved',
        args: {
          token: matchAddress(aToken),
          oracleAddress: matchAddress(anOracle),
        },
      })
    })

    it('should revert when the wrong index is provided', async () => {
      await assertRevert(sortedOracles.removeOracle(aToken, anOracle, 1))
    })

    it('should revert when the wrong address is provided', async () => {
      await assertRevert(sortedOracles.removeOracle(aToken, accounts[0], 0))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(sortedOracles.removeOracle(aToken, anOracle, 0, { from: accounts[1] }))
    })
  })

  describe('#report', () => {
    function expectedMedianRateFromGiven(
      givenNumerator: number | BigNumber,
      givenDenominator: number | BigNumber
    ): BigNumber {
      return toFixed(new BigNumber(givenNumerator).dividedBy(new BigNumber(givenDenominator)))
    }

    const numerator = 5
    const denominator = 1
    const expectedMedianRate = expectedMedianRateFromGiven(numerator, denominator)
    beforeEach(async () => {
      await sortedOracles.addOracle(aToken, anOracle)
    })

    it('should increase the number of rates', async () => {
      await sortedOracles.report(
        aToken,
        toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
        NULL_ADDRESS,
        NULL_ADDRESS,
        {
          from: anOracle,
        }
      )
      assert.equal((await sortedOracles.numRates(aToken)).toNumber(), 1)
    })

    it('should set the median rate', async () => {
      await sortedOracles.report(
        aToken,
        toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
        NULL_ADDRESS,
        NULL_ADDRESS,
        {
          from: anOracle,
        }
      )
      const [actualMedianRate, numberOfRates] = await sortedOracles.medianRate(aToken)
      assertEqualBN(actualMedianRate, expectedMedianRate)
      assertEqualBN(numberOfRates.toNumber(), 1)
    })

    it('should increase the number of timestamps', async () => {
      await sortedOracles.report(
        aToken,
        toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
        NULL_ADDRESS,
        NULL_ADDRESS,
        {
          from: anOracle,
        }
      )
      assertEqualBN(await sortedOracles.numTimestamps(aToken), 1)
    })

    it('should set the median timestamp', async () => {
      await sortedOracles.report(
        aToken,
        toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
        NULL_ADDRESS,
        NULL_ADDRESS,
        {
          from: anOracle,
        }
      )
      const blockTimestamp = (await web3.eth.getBlock('latest')).timestamp
      assert.equal((await sortedOracles.medianTimestamp(aToken)).toNumber(), blockTimestamp)
    })

    it('should emit the OracleReported and MedianUpdated events', async () => {
      const resp = await sortedOracles.report(
        aToken,
        toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
        NULL_ADDRESS,
        NULL_ADDRESS,
        {
          from: anOracle,
        }
      )
      assert.equal(resp.logs.length, 2)
      assertLogMatches2(resp.logs[0], {
        event: 'OracleReported',
        args: {
          token: matchAddress(aToken),
          oracle: matchAddress(anOracle),
          timestamp: matchAny,
          value: expectedMedianRate,
        },
      })

      assertLogMatches2(resp.logs[1], {
        event: 'MedianUpdated',
        args: {
          token: matchAddress(aToken),
          newMedian: expectedMedianRate,
        },
      })
    })

    it('should revert when called by a non-oracle', async () => {
      await assertRevert(
        sortedOracles.report(
          aToken,
          toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      )
    })

    describe('when there exists exactly one other report, made by this oracle', () => {
      const newMedianRate = 12
      const newExpectedMedianRate = expectedMedianRateFromGiven(newMedianRate, denominator)

      beforeEach(async () => {
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(newMedianRate).dividedBy(new BigNumber(denominator))),
          NULL_ADDRESS,
          NULL_ADDRESS,
          {
            from: anOracle,
          }
        )
      })
      it('should reset the median rate', async () => {
        const [initialMedianRate] = await sortedOracles.medianRate(aToken)
        assertEqualBN(initialMedianRate, newExpectedMedianRate)
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(newMedianRate).dividedBy(new BigNumber(denominator))),
          NULL_ADDRESS,
          NULL_ADDRESS,
          {
            from: anOracle,
          }
        )

        const [actualMedianRate] = await sortedOracles.medianRate(aToken)
        assertEqualBN(actualMedianRate, newExpectedMedianRate)
      })
      it('should not change the number of total reports', async () => {
        const initialNumReports = await sortedOracles.numRates(aToken)
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(newMedianRate).dividedBy(new BigNumber(denominator))),
          NULL_ADDRESS,
          NULL_ADDRESS,
          {
            from: anOracle,
          }
        )

        assertEqualBN(initialNumReports, await sortedOracles.numRates(aToken))
      })
    })

    describe('when there are multiple reports, the most recent one done by this oracle', () => {
      const anotherOracle = accounts[6]
      const anOracleMedianRate1 = 2
      const anOracleMedianRate2 = 3
      const anotherOracleMedianRate = 1

      const anOracleExpectedMedianRate1 = expectedMedianRateFromGiven(
        anOracleMedianRate1,
        denominator
      )
      const anOracleExpectedMedianRate2 = expectedMedianRateFromGiven(
        anOracleMedianRate2,
        denominator
      )

      const anotherOracleExpectedMedianRate = expectedMedianRateFromGiven(
        anotherOracleMedianRate,
        denominator
      )

      beforeEach(async () => {
        sortedOracles.addOracle(aToken, anotherOracle)
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(anotherOracleMedianRate).dividedBy(new BigNumber(denominator))),
          NULL_ADDRESS,
          NULL_ADDRESS,
          {
            from: anotherOracle,
          }
        )
        await timeTravel(5, web3)
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(anOracleMedianRate1).dividedBy(new BigNumber(denominator))),
          anotherOracle,
          NULL_ADDRESS,
          {
            from: anOracle,
          }
        )
        await timeTravel(5, web3)

        // confirm the setup worked
        const initialRates = await sortedOracles.getRates(aToken)
        assertEqualBN(initialRates['1'][0], anOracleExpectedMedianRate1)
        assertEqualBN(initialRates['1'][1], anotherOracleExpectedMedianRate)
      })

      it('updates the list of rates correctly', async () => {
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(anOracleMedianRate2).dividedBy(new BigNumber(denominator))),
          anotherOracle,
          NULL_ADDRESS,
          {
            from: anOracle,
          }
        )
        const resultRates = await sortedOracles.getRates(aToken)
        assertEqualBN(resultRates['1'][0], anOracleExpectedMedianRate2)
        assertEqualBN(resultRates['1'][1], anotherOracleExpectedMedianRate)
      })

      it('updates the latest timestamp', async () => {
        const initialTimestamps = await sortedOracles.getTimestamps(aToken)
        await sortedOracles.report(
          aToken,
          toFixed(new BigNumber(numerator).dividedBy(new BigNumber(denominator))),
          anotherOracle,
          NULL_ADDRESS,
          {
            from: anOracle,
          }
        )
        const resultTimestamps = await sortedOracles.getTimestamps(aToken)

        // the second timestamp, belonging to anotherOracle should be unchanged
        assertEqualBN(initialTimestamps['1']['1'], resultTimestamps['1']['1'])

        // the most recent timestamp, belonging to anOracle in both cases, should change
        assert.isTrue(resultTimestamps['1']['0'].gt(initialTimestamps['1']['0']))
      })
    })
  })
})
