import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  isSameAddress,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { fixed1, fromFixed, multiply, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ExchangeContract,
  ExchangeInstance,
  FreezerContract,
  FreezerInstance,
  GoldTokenContract,
  GoldTokenInstance,
  MockReserveContract,
  MockReserveInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  RegistryContract,
  RegistryInstance,
  StableTokenContract,
  StableTokenInstance,
} from 'types'

const Exchange: ExchangeContract = artifacts.require('Exchange')
const Freezer: FreezerContract = artifacts.require('Freezer')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockReserve: MockReserveContract = artifacts.require('MockReserve')
const Registry: RegistryContract = artifacts.require('Registry')
const StableToken: StableTokenContract = artifacts.require('StableToken')

// @ts-ignore
// TODO(mcortesi): Use BN.js
StableToken.numberFormat = 'BigNumber'
// @ts-ignore
Exchange.numberFormat = 'BigNumber'
// @ts-ignore
MockReserve.numberFormat = 'BigNumber'
// @ts-ignore
GoldToken.numberFormat = 'BigNumber'

contract('Exchange', (accounts: string[]) => {
  let exchange: ExchangeInstance
  let freezer: FreezerInstance
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance

  const decimals = 18

  const owner = accounts[0]

  const spread = toFixed(3 / 1000)

  const updateFrequency = 60 * 60
  const minimumReports = 2
  const SECONDS_IN_A_WEEK = 604800

  const unit = new BigNumber(10).pow(decimals)
  const initialReserveBalance = new BigNumber(10000000000000000000000)
  const reserveFraction = toFixed(5 / 100)
  const initialGoldBucket = initialReserveBalance
    .times(fromFixed(reserveFraction))
    .integerValue(BigNumber.ROUND_FLOOR)
  const goldAmountForRate = new BigNumber('0x10000000000000000')
  const stableAmountForRate = new BigNumber(2).times(goldAmountForRate)
  const initialStableBucket = initialGoldBucket.times(stableAmountForRate).div(goldAmountForRate)
  function getBuyTokenAmount(
    sellAmount: BigNumber,
    sellSupply: BigNumber,
    buySupply: BigNumber,
    _spread: BigNumber = spread
  ) {
    const reducedSellAmount = multiply(fixed1.minus(_spread), toFixed(sellAmount))
    const numerator = multiply(reducedSellAmount, toFixed(buySupply))
    const denominator = toFixed(sellSupply).plus(reducedSellAmount)
    return numerator.idiv(denominator)
  }

  async function fundReserve() {
    // Would have used goldToken here, but ran into issues of inability to transfer
    // TODO: Remove in https://github.com/celo-org/celo-monorepo/issues/2000
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: mockReserve.address,
      value: initialReserveBalance.toString(),
    })
  }

  beforeEach(async () => {
    freezer = await Freezer.new()
    goldToken = await GoldToken.new()
    mockReserve = await MockReserve.new()
    stableToken = await StableToken.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)
    await registry.setAddressFor(CeloContractName.Reserve, mockReserve.address)
    await mockReserve.setGoldToken(goldToken.address)

    await goldToken.initialize(registry.address)
    // TODO: use MockStableToken for this
    await stableToken.initialize(
      'Celo Dollar',
      'cUSD',
      decimals,
      registry.address,
      fixed1,
      SECONDS_IN_A_WEEK,
      [],
      []
    )

    mockSortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
    await mockSortedOracles.setMedianRate(stableToken.address, stableAmountForRate)
    await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
    await mockSortedOracles.setNumRates(stableToken.address, 2)

    await fundReserve()

    exchange = await Exchange.new()
    await exchange.initialize(
      registry.address,
      stableToken.address,
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    )
    await registry.setAddressFor(CeloContractName.Exchange, exchange.address)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const expectedOwner: string = await exchange.owner()
      assert.equal(expectedOwner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(
        exchange.initialize(
          registry.address,
          stableToken.address,
          spread,
          reserveFraction,
          updateFrequency,
          minimumReports
        )
      )
    })
  })

  describe('#setUpdateFrequency', () => {
    const newUpdateFrequency = new BigNumber(60 * 30)

    it('should set the update frequency', async () => {
      await exchange.setUpdateFrequency(newUpdateFrequency)

      const actualUpdateFrequency = await exchange.updateFrequency()

      assert.isTrue(actualUpdateFrequency.eq(newUpdateFrequency))
    })

    it('should emit a UpdateFrequencySet event', async () => {
      const tx = await exchange.setUpdateFrequency(newUpdateFrequency)
      assert(tx.logs.length === 1, 'Did not receive event')

      const log = tx.logs[0]
      assertLogMatches2(log, {
        event: 'UpdateFrequencySet',
        args: {
          updateFrequency: newUpdateFrequency,
        },
      })
    })

    it('should not allow a non-owner not set the update frequency', async () => {
      await assertRevert(exchange.setUpdateFrequency(newUpdateFrequency, { from: accounts[1] }))
    })
  })

  describe('#setMinimumReports', () => {
    const newMinimumReports = new BigNumber(3)

    it('should set the minimum reports', async () => {
      await exchange.setMinimumReports(newMinimumReports)

      const actualMinimumReports = await exchange.minimumReports()

      assert.isTrue(actualMinimumReports.eq(newMinimumReports))
    })

    it('should emit a MinimumReportsSet event', async () => {
      const tx = await exchange.setMinimumReports(newMinimumReports)
      assert(tx.logs.length === 1, 'Did not receive event')

      const log = tx.logs[0]
      assertLogMatches2(log, {
        event: 'MinimumReportsSet',
        args: {
          minimumReports: newMinimumReports,
        },
      })
    })

    it('should not allow a non-owner not set the minimum reports', async () => {
      await assertRevert(exchange.setMinimumReports(newMinimumReports, { from: accounts[1] }))
    })
  })

  describe('#setStableToken', () => {
    const newStable = '0x0000000000000000000000000000000000077cfa'

    it('should set the stable token address', async () => {
      await exchange.setStableToken(newStable)

      const actualStable = await exchange.stable()
      assert.equal(actualStable, newStable)
    })

    it('should emit a StableTokenSet event', async () => {
      const tx = await exchange.setStableToken(newStable)
      assert(tx.logs.length === 1, 'Did not receive event')

      const log = tx.logs[0]
      assertLogMatches2(log, {
        event: 'StableTokenSet',
        args: {
          stable: newStable,
        },
      })
    })

    it('should not allow a non-owner not set the spread', async () => {
      await assertRevert(exchange.setStableToken(newStable, { from: accounts[1] }))
    })
  })

  describe('#setSpread', () => {
    const newSpread = toFixed(6 / 1000)

    it('should set the spread', async () => {
      await exchange.setSpread(newSpread)

      const actualSpread = await exchange.spread()

      assert.isTrue(actualSpread.eq(newSpread))
    })

    it('should emit a SpreadSet event', async () => {
      const tx = await exchange.setSpread(newSpread)
      assert(tx.logs.length === 1, 'Did not receive event')

      const log = tx.logs[0]
      assertLogMatches2(log, {
        event: 'SpreadSet',
        args: {
          spread: newSpread,
        },
      })
    })

    it('should not allow a non-owner not set the spread', async () => {
      await assertRevert(exchange.setSpread(newSpread, { from: accounts[1] }))
    })
  })

  describe('#setReserveFraction', () => {
    const newReserveFraction = toFixed(3 / 100)

    it('should set the reserve fraction', async () => {
      await exchange.setReserveFraction(newReserveFraction)

      const actualReserveFraction = await exchange.reserveFraction()

      assert.isTrue(actualReserveFraction.eq(newReserveFraction))
    })

    it('should emit a ReserveFractionSet event', async () => {
      const tx = await exchange.setReserveFraction(newReserveFraction)
      assert(tx.logs.length === 1, 'Did not receive event')

      const log = tx.logs[0]
      assertLogMatches2(log, {
        event: 'ReserveFractionSet',
        args: {
          reserveFraction: newReserveFraction,
        },
      })
    })

    it('should not allow to set the reserve fraction greater or equal to one', async () => {
      await assertRevert(exchange.setReserveFraction(toFixed(1)))
    })

    it('should not allow a non-owner not set the reserve fraction', async () => {
      await assertRevert(exchange.setReserveFraction(newReserveFraction, { from: accounts[1] }))
    })
  })

  describe('#getBuyAndSellBuckets', () => {
    it('should return the correct amount of buy and sell token', async () => {
      const [buyBucketSize, sellBucketSize] = await exchange.getBuyAndSellBuckets(true)
      assertEqualBN(sellBucketSize, initialGoldBucket)
      assertEqualBN(buyBucketSize, initialStableBucket)
    })

    describe(`after the Reserve's balance changes`, () => {
      beforeEach(async () => {
        await fundReserve()
      })

      it(`should return the same value if updateFrequency seconds haven't passed yet`, async () => {
        await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
        const [buyBucketSize, sellBucketSize] = await exchange.getBuyAndSellBuckets(true)

        assertEqualBN(sellBucketSize, initialGoldBucket)
        assertEqualBN(buyBucketSize, initialStableBucket)
      })

      it(`should return a new value once updateFrequency seconds have passed`, async () => {
        await timeTravel(updateFrequency, web3)
        await mockSortedOracles.setMedianTimestampToNow(stableToken.address)

        const [buyBucketSize, sellBucketSize] = await exchange.getBuyAndSellBuckets(true)

        assertEqualBN(sellBucketSize, initialGoldBucket.times(2))
        assertEqualBN(buyBucketSize, initialStableBucket.times(2))
      })
    })

    describe('after an oracle update', () => {
      beforeEach(async () => {
        await mockSortedOracles.setMedianRate(stableToken.address, goldAmountForRate.times(4))
      })

      it(`should return the same value if updateFrequency seconds haven't passed yet`, async () => {
        await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
        const [buyBucketSize, sellBucketSize] = await exchange.getBuyAndSellBuckets(true)

        assertEqualBN(sellBucketSize, initialGoldBucket)
        assertEqualBN(buyBucketSize, initialStableBucket)
      })

      it(`should return a new value once updateFrequency seconds have passed`, async () => {
        await timeTravel(updateFrequency, web3)
        await mockSortedOracles.setMedianTimestampToNow(stableToken.address)

        const [buyBucketSize, sellBucketSize] = await exchange.getBuyAndSellBuckets(true)

        assertEqualBN(sellBucketSize, initialGoldBucket)
        assertEqualBN(buyBucketSize, initialStableBucket.times(2))
      })
    })
  })

  describe('#getBuyTokenAmount', () => {
    it('should return the correct amount of buyToken', async () => {
      const amount = 10
      const buyAmount = await exchange.getBuyTokenAmount(amount, true)

      const expectedBuyAmount = getBuyTokenAmount(
        new BigNumber(amount),
        initialGoldBucket,
        initialStableBucket
      )

      assert.equal(buyAmount.toString(), expectedBuyAmount.toString())
    })
  })

  describe('#exchange', () => {
    const user = accounts[1]

    describe('when exchanging gold for stable', () => {
      const goldTokenAmount = unit.div(500).integerValue(BigNumber.ROUND_FLOOR)
      const expectedStableBalance = getBuyTokenAmount(
        goldTokenAmount,
        initialGoldBucket,
        initialStableBucket
      )
      let oldGoldBalance: BigNumber
      let oldReserveGoldBalance: BigNumber
      let oldTotalSupply: BigNumber
      beforeEach(async () => {
        oldTotalSupply = await stableToken.totalSupply()
        oldReserveGoldBalance = await goldToken.balanceOf(mockReserve.address)
        await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
        oldGoldBalance = await goldToken.balanceOf(user)
      })

      it(`should increase the user's stable balance`, async () => {
        await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const newStableBalance = await stableToken.balanceOf(user)
        assertEqualBN(newStableBalance, expectedStableBalance)
      })

      it(`should decrease the user's gold balance`, async () => {
        await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const actualGoldBalance = await goldToken.balanceOf(user)
        let expectedGoldBalance = oldGoldBalance.minus(goldTokenAmount)
        const block = await web3.eth.getBlock('latest')
        if (isSameAddress(block.miner, user)) {
          const blockReward = new BigNumber(2).times(new BigNumber(10).pow(decimals))
          expectedGoldBalance = expectedGoldBalance.plus(blockReward)
        }
        assertEqualBN(actualGoldBalance, expectedGoldBalance)
      })

      it(`should remove the user's allowance`, async () => {
        await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const allowance = await goldToken.allowance(user, exchange.address)
        assert.isTrue(allowance.isZero())
      })

      it(`should increase the Reserve's balance`, async () => {
        await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const newReserveGoldBalance = await goldToken.balanceOf(mockReserve.address)
        assert.isTrue(newReserveGoldBalance.eq(oldReserveGoldBalance.plus(goldTokenAmount)))
      })

      it('should increase the total StableToken supply', async () => {
        await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const newTotalSupply = await stableToken.totalSupply()
        assert.isTrue(newTotalSupply.eq(oldTotalSupply.plus(expectedStableBalance)))
      })

      it('should affect token supplies', async () => {
        await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const [mintableStable, tradeableGold] = await exchange.getBuyAndSellBuckets(true)
        const expectedTradeableGold = initialGoldBucket.plus(goldTokenAmount)
        const expectedMintableStable = initialStableBucket.minus(expectedStableBalance)
        assertEqualBN(tradeableGold, expectedTradeableGold)
        assertEqualBN(mintableStable, expectedMintableStable)
      })

      it('should emit an Exchanged event', async () => {
        const exchangeTx = await exchange.exchange(
          goldTokenAmount,
          expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
          true,
          {
            from: user,
          }
        )
        const exchangeLogs = exchangeTx.logs.filter((x) => x.event === 'Exchanged')
        assert(exchangeLogs.length === 1, 'Did not receive event')

        const log = exchangeLogs[0]
        assertLogMatches2(log, {
          event: 'Exchanged',
          args: {
            exchanger: user,
            sellAmount: goldTokenAmount,
            buyAmount: expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
            soldGold: true,
          },
        })
      })

      it('should revert without sufficient approvals', async () => {
        await assertRevert(
          exchange.exchange(
            goldTokenAmount.plus(1),
            expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR),
            true,
            {
              from: user,
            }
          )
        )
      })

      it('should revert if the minBuyAmount could not be satisfied', async () => {
        await assertRevert(
          exchange.exchange(
            goldTokenAmount,
            expectedStableBalance.integerValue(BigNumber.ROUND_FLOOR).plus(1),
            true,
            {
              from: user,
            }
          )
        )
      })

      describe('when buckets need updating', () => {
        // fundReserve() will double the amount in the gold bucket
        const updatedGoldBucket = initialGoldBucket.times(2)

        const updatedStableBucket = updatedGoldBucket
          .times(stableAmountForRate)
          .div(goldAmountForRate)

        beforeEach(async () => {
          await fundReserve()
          await timeTravel(updateFrequency, web3)
          await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
        })

        describe('when the oldest oracle report is not expired', () => {
          const expectedStableAmount = getBuyTokenAmount(
            goldTokenAmount,
            updatedGoldBucket,
            updatedStableBucket
          )

          it('the exchange should succeed', async () => {
            await exchange.exchange(
              goldTokenAmount,
              expectedStableAmount.integerValue(BigNumber.ROUND_FLOOR),
              true,
              {
                from: user,
              }
            )
            const newStableBalance = await stableToken.balanceOf(user)
            assertEqualBN(newStableBalance, expectedStableAmount)
          })

          it('should update the buckets', async () => {
            await exchange.exchange(
              goldTokenAmount,
              expectedStableAmount.integerValue(BigNumber.ROUND_FLOOR),
              true,
              {
                from: user,
              }
            )
            const newGoldBucket = await exchange.goldBucket()
            const newStableBucket = await exchange.stableBucket()

            // The new value should be the updatedGoldBucket value, which is 2x the
            // initial amount after fundReserve() is called, plus the amount of gold
            // that was paid in the exchange.
            assertEqualBN(newGoldBucket, updatedGoldBucket.plus(goldTokenAmount))

            // The new value should be the updatedStableBucket (derived from the new
            // Gold Bucket value), minus the amount purchased during the exchange
            assertEqualBN(newStableBucket, updatedStableBucket.minus(expectedStableAmount))
          })
        })

        describe('when the oldest oracle report is expired', () => {
          const expectedStableAmount = getBuyTokenAmount(
            goldTokenAmount,
            initialGoldBucket,
            initialStableBucket
          )

          beforeEach(async () => {
            await mockSortedOracles.setOldestReportExpired(stableToken.address)
          })

          it('the exchange should succeed', async () => {
            await exchange.exchange(
              goldTokenAmount,
              expectedStableAmount.integerValue(BigNumber.ROUND_FLOOR),
              true,
              {
                from: user,
              }
            )
            const newStableBalance = await stableToken.balanceOf(user)
            assertEqualBN(newStableBalance, expectedStableAmount)
          })

          it('should not update the buckets', async () => {
            await exchange.exchange(
              goldTokenAmount,
              expectedStableAmount.integerValue(BigNumber.ROUND_FLOOR),
              true,
              {
                from: user,
              }
            )
            const newGoldBucket = await exchange.goldBucket()
            const newStableBucket = await exchange.stableBucket()

            // The new value should be the initialGoldBucket value plus the goldTokenAmount.
            assertEqualBN(newGoldBucket, initialGoldBucket.plus(goldTokenAmount))

            // The new value should be the initialStableBucket minus the amount purchased during the exchange
            assertEqualBN(newStableBucket, initialStableBucket.minus(expectedStableAmount))
          })
        })
      })
    })

    describe('when exchanging stable for gold', () => {
      const stableTokenBalance = unit.div(1000).integerValue(BigNumber.ROUND_FLOOR)
      const expectedGoldBalanceIncrease = getBuyTokenAmount(
        stableTokenBalance,
        initialStableBucket,
        initialGoldBucket
      )
      let oldGoldBalance: BigNumber
      let oldReserveGoldBalance: BigNumber
      beforeEach(async () => {
        await registry.setAddressFor(CeloContractName.Exchange, owner)
        await stableToken.mint(user, stableTokenBalance)
        await registry.setAddressFor(CeloContractName.Exchange, exchange.address)

        oldReserveGoldBalance = await goldToken.balanceOf(mockReserve.address)
        await stableToken.approve(exchange.address, stableTokenBalance, { from: user })
        oldGoldBalance = await goldToken.balanceOf(user)
      })

      it(`should decrease the user's stable balance`, async () => {
        await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const newStableBalance = await stableToken.balanceOf(user)
        assert.isTrue(newStableBalance.isZero())
      })

      it(`should increase the user's gold balance`, async () => {
        await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const actualGoldBalance = await goldToken.balanceOf(user)
        let expectedGoldBalance = oldGoldBalance.plus(expectedGoldBalanceIncrease)
        const block = await web3.eth.getBlock('latest')
        if (isSameAddress(block.miner, user)) {
          const blockReward = new BigNumber(2).times(new BigNumber(10).pow(decimals))
          expectedGoldBalance = expectedGoldBalance.plus(blockReward)
        }
        assert.isTrue(actualGoldBalance.eq(expectedGoldBalance))
      })

      it(`should remove the user's allowance`, async () => {
        await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const allowance = await goldToken.allowance(user, exchange.address)
        assert.isTrue(allowance.isZero())
      })

      it(`should decrease the Reserve's balance`, async () => {
        await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const newReserveGoldBalance = await goldToken.balanceOf(mockReserve.address)
        assert.isTrue(
          newReserveGoldBalance.eq(oldReserveGoldBalance.minus(expectedGoldBalanceIncrease))
        )
      })

      it('should decrease the total StableToken supply', async () => {
        await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const newTotalSupply = await stableToken.totalSupply()
        assert.isTrue(newTotalSupply.isZero())
      })

      it('should affect token supplies', async () => {
        await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const [tradeableGold, mintableStable] = await exchange.getBuyAndSellBuckets(false)
        const expectedMintableStable = initialStableBucket.plus(stableTokenBalance)
        const expectedTradeableGold = initialGoldBucket.minus(expectedGoldBalanceIncrease)
        assert.isTrue(mintableStable.eq(expectedMintableStable))
        assert.isTrue(tradeableGold.eq(expectedTradeableGold))
      })

      it('should emit an Exchanged event', async () => {
        const exchangeTx = await exchange.exchange(
          stableTokenBalance,
          expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
          false,
          {
            from: user,
          }
        )
        const exchangeLogs = exchangeTx.logs.filter((x) => x.event === 'Exchanged')
        assert(exchangeLogs.length === 1, 'Did not receive event')

        const log = exchangeLogs[0]
        assertLogMatches2(log, {
          event: 'Exchanged',
          args: {
            exchanger: user,
            sellAmount: stableTokenBalance,
            buyAmount: expectedGoldBalanceIncrease,
            soldGold: false,
          },
        })
      })

      it('should revert without sufficient approvals', async () => {
        await assertRevert(
          exchange.exchange(
            stableTokenBalance.plus(1),
            expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR),
            false,
            {
              from: user,
            }
          )
        )
      })

      it('should revert if the minBuyAmount could not be satisfied', async () => {
        await assertRevert(
          exchange.exchange(
            stableTokenBalance,
            expectedGoldBalanceIncrease.integerValue(BigNumber.ROUND_FLOOR).plus(1),
            false,
            {
              from: user,
            }
          )
        )
      })

      describe('when buckets need updating', () => {
        // fundReserve() will double the amount in the gold bucket
        const updatedGoldBucket = initialGoldBucket.times(2)

        const updatedStableBucket = updatedGoldBucket
          .times(stableAmountForRate)
          .div(goldAmountForRate)

        const expectedGoldAmount = getBuyTokenAmount(
          stableTokenBalance,
          updatedStableBucket,
          updatedGoldBucket
        )

        beforeEach(async () => {
          await fundReserve()
          await timeTravel(updateFrequency, web3)
          await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
        })

        it('the exchange should succeed', async () => {
          await exchange.exchange(
            stableTokenBalance,
            expectedGoldAmount.integerValue(BigNumber.ROUND_FLOOR),
            false,
            {
              from: user,
            }
          )
          const newGoldBalance = await goldToken.balanceOf(user)
          assertEqualBN(newGoldBalance, oldGoldBalance.plus(expectedGoldAmount))
        })

        it('should update the buckets', async () => {
          await exchange.exchange(
            stableTokenBalance,
            expectedGoldAmount.integerValue(BigNumber.ROUND_FLOOR),
            false,
            {
              from: user,
            }
          )
          const newGoldBucket = await exchange.goldBucket()
          const newStableBucket = await exchange.stableBucket()

          // The new value should be the updatedGoldBucket value, which is 2x the
          // initial amount after fundReserve() is called, plus the amount of gold
          // that was paid in the exchange.
          assertEqualBN(newGoldBucket, updatedGoldBucket.minus(expectedGoldAmount))

          // The new value should be the updatedStableBucket (derived from the new
          // Gold Bucket value), minus the amount purchased during the exchange
          assertEqualBN(newStableBucket, updatedStableBucket.plus(stableTokenBalance))
        })

        it('should emit an BucketsUpdated event', async () => {
          const exchangeTx = await exchange.exchange(
            stableTokenBalance,
            expectedGoldAmount.integerValue(BigNumber.ROUND_FLOOR),
            false,
            {
              from: user,
            }
          )

          const exchangeLogs = exchangeTx.logs.filter((x) => x.event === 'BucketsUpdated')
          assert(exchangeLogs.length === 1, 'Did not receive event')

          const log = exchangeLogs[0]
          assertLogMatches2(log, {
            event: 'BucketsUpdated',
            args: {
              goldBucket: updatedGoldBucket,
              stableBucket: updatedStableBucket,
            },
          })
        })
      })
    })

    describe('when the contract is frozen', () => {
      beforeEach(async () => {
        await freezer.freeze(exchange.address)
      })

      it('should revert', async () => {
        await goldToken.approve(exchange.address, 1000)
        await assertRevert(exchange.exchange(1000, 1, true))
      })
    })
  })
})
