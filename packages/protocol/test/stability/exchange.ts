import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  isSameAddress,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  ExchangeInstance,
  GoldTokenInstance,
  MockReserveInstance,
  MockSortedOraclesInstance,
  RegistryInstance,
  StableTokenInstance,
} from 'types'

const Exchange: Truffle.Contract<ExchangeInstance> = artifacts.require('Exchange')
const GoldToken: Truffle.Contract<GoldTokenInstance> = artifacts.require('GoldToken')
const MockSortedOracles: Truffle.Contract<MockSortedOraclesInstance> = artifacts.require(
  'MockSortedOracles'
)
const MockReserve: Truffle.Contract<MockReserveInstance> = artifacts.require('MockReserve')
const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const StableToken: Truffle.Contract<StableTokenInstance> = artifacts.require('StableToken')

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
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance

  const decimals = 18

  const owner = accounts[0]

  const spreadNumerator = new BigNumber(3)
  const spreadDenominator = new BigNumber(1000)

  const updateFrequency = 60 * 60
  const minimumReports = 2
  const SECONDS_IN_A_WEEK = 604800

  const unit = new BigNumber(10).pow(decimals)
  const initialReserveBalance = new BigNumber(1000)
  const reserveFractionNumerator = new BigNumber(5)
  const reserveFractionDenominator = new BigNumber(100)
  const initialGoldBucket = initialReserveBalance
    .times(reserveFractionNumerator)
    .div(reserveFractionDenominator)
  const stableAmountForRate = new BigNumber(2)
  const goldAmountForRate = new BigNumber(1)
  const initialStableBucket = initialGoldBucket.times(stableAmountForRate).div(goldAmountForRate)
  function getBuyTokenAmount(
    sellAmount: BigNumber,
    sellSupply: BigNumber,
    buySupply: BigNumber,
    numerator: BigNumber = spreadNumerator,
    denominator: BigNumber = spreadDenominator
  ) {
    const alpha = new BigNumber(sellAmount).div(sellSupply)
    const gamma = new BigNumber(1).minus(numerator.div(denominator))
    const res = alpha
      .times(gamma)
      .times(buySupply)
      .div(alpha.times(gamma).plus(1))
      .integerValue(BigNumber.ROUND_FLOOR)
    return res
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
    registry = await Registry.new()
    goldToken = await GoldToken.new()
    await registry.setAddressFor('GoldToken', goldToken.address)

    mockReserve = await MockReserve.new()
    await registry.setAddressFor('Reserve', mockReserve.address)
    await mockReserve.setGoldToken(goldToken.address)

    stableToken = await StableToken.new()
    // TODO: use MockStableToken for this
    await stableToken.initialize(
      'Celo Dollar',
      'cUSD',
      decimals,
      registry.address,
      1,
      1,
      SECONDS_IN_A_WEEK
    )

    mockSortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor('SortedOracles', mockSortedOracles.address)
    await mockSortedOracles.setMedianRate(
      stableToken.address,
      stableAmountForRate,
      goldAmountForRate
    )
    await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
    await mockSortedOracles.setNumRates(stableToken.address, 2)

    await fundReserve()

    exchange = await Exchange.new()
    await exchange.initialize(
      registry.address,
      stableToken.address,
      spreadNumerator,
      spreadDenominator,
      reserveFractionNumerator,
      reserveFractionDenominator,
      updateFrequency,
      minimumReports
    )

    await stableToken.setMinter(exchange.address)
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
          spreadNumerator,
          spreadDenominator,
          reserveFractionNumerator,
          reserveFractionDenominator,
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
        await mockSortedOracles.setMedianRate(stableToken.address, 4, 1)
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
        await stableToken.setMinter(owner)
        await stableToken.mint(user, stableTokenBalance)
        await stableToken.setMinter(exchange.address)

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
    })
  })
})
