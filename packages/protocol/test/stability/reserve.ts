import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertRevert,
  assertSameAddress,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import BN = require('bn.js')
import {
  MockGoldTokenInstance,
  MockSortedOraclesInstance,
  MockStableTokenInstance,
  RegistryInstance,
  ReserveInstance,
} from 'types'

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')
const Reserve: Truffle.Contract<ReserveInstance> = artifacts.require('Reserve')
const MockGoldToken: Truffle.Contract<MockGoldTokenInstance> = artifacts.require('MockGoldToken')
const MockStableToken: Truffle.Contract<MockStableTokenInstance> = artifacts.require(
  'MockStableToken'
)
const MockSortedOracles: Truffle.Contract<MockSortedOraclesInstance> = artifacts.require(
  'MockSortedOracles'
)

contract('Reserve', (accounts: string[]) => {
  let reserve: ReserveInstance
  let registry: RegistryInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockGoldToken: MockGoldTokenInstance

  const anAddress: string = '0x00000000000000000000000000000000deadbeef'
  const nonOwner: string = accounts[1]
  const spender: string = accounts[2]
  const aTobinTaxStalenessThreshold: number = 600
  const aDailySpendingRatio: string = '1000000000000000000000000'
  const sortedOraclesDenominator = new BigNumber('0x10000000000000000')
  beforeEach(async () => {
    reserve = await Reserve.new()
    registry = await Registry.new()
    mockSortedOracles = await MockSortedOracles.new()
    mockGoldToken = await MockGoldToken.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
    await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
    await reserve.initialize(registry.address, aTobinTaxStalenessThreshold, aDailySpendingRatio)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await reserve.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set the registry address', async () => {
      const registryAddress: string = await reserve.registry()
      assertSameAddress(registryAddress, registry.address)
    })

    it('should have set the tobin tax staleness threshold', async () => {
      const tobinTaxStalenessThreshold = await reserve.tobinTaxStalenessThreshold()
      assertEqualBN(tobinTaxStalenessThreshold, aTobinTaxStalenessThreshold)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        reserve.initialize(registry.address, aTobinTaxStalenessThreshold, aDailySpendingRatio)
      )
    })
  })

  describe('#setDailySpendingRatio()', async () => {
    it('should allow owner to set the ratio', async () => {
      await reserve.setDailySpendingRatio(123)
      assert.equal(123, (await reserve.getDailySpendingRatio()).toNumber())
    })
    it('should emit corresponding event', async () => {
      const response = await reserve.setDailySpendingRatio(123)
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'DailySpendingRatioSet')
      assert.equal(events[0].args.ratio.toNumber(), 123)
    })
    it('should not allow other users to set the ratio', async () => {
      await assertRevert(reserve.setDailySpendingRatio(123, { from: nonOwner }))
    })
    it('should not be allowed to set it larger than 100%', async () => {
      await assertRevert(reserve.setDailySpendingRatio(toFixed(1.3)))
    })
  })

  describe('#setRegistry()', () => {
    it('should allow owner to set registry', async () => {
      await reserve.setRegistry(anAddress)
      assertSameAddress(await reserve.registry(), anAddress)
    })

    it('should not allow other users to set registry', async () => {
      await assertRevert(reserve.setRegistry(anAddress, { from: nonOwner }))
    })
  })

  describe('#addToken()', () => {
    beforeEach(async () => {
      await mockSortedOracles.setMedianRate(anAddress, sortedOraclesDenominator)
    })

    it('should allow owner to add a token', async () => {
      await reserve.addToken(anAddress)
      assert.isTrue(await reserve.isToken(anAddress))
    })

    it('should not allow other users to add a token', async () => {
      await assertRevert(reserve.addToken(anAddress, { from: nonOwner }))
    })

    it('should emit a TokenAdded event', async () => {
      const response = await reserve.addToken(anAddress)
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'TokenAdded')
      assert.equal(events[0].args.token.toLowerCase(), anAddress.toLowerCase())
    })

    describe('when the token has already been added', () => {
      beforeEach(async () => {
        await reserve.addToken(anAddress)
      })

      it('should not allow owner to add an existing token', async () => {
        await assertRevert(reserve.addToken(anAddress))
      })
    })
  })

  describe('#removeToken()', () => {
    let index: number = 0

    it('should not allow owner to remove an unadded token', async () => {
      await assertRevert(reserve.removeToken(anAddress, index))
    })

    describe('when the token has already been added', () => {
      beforeEach(async () => {
        await mockSortedOracles.setMedianRate(anAddress, sortedOraclesDenominator)
        await reserve.addToken(anAddress)
        const tokenList = await reserve.getTokens()
        index = -1
        for (let i = 0; i < tokenList.length; i++) {
          if (tokenList[i].toLowerCase() === anAddress.toLowerCase()) {
            index = i
          }
        }
      })

      it('should allow owner to remove a token', async () => {
        await reserve.removeToken(anAddress, index)
        assert.isFalse(await reserve.isToken(anAddress))
      })

      it('should not allow other users to remove a token', async () => {
        await assertRevert(reserve.removeToken(anAddress, index, { from: nonOwner }))
      })

      it('should emit a TokenRemoved event', async () => {
        const response = await reserve.removeToken(anAddress, index)
        const events = response.logs
        assert.equal(events.length, 1)
        assert.equal(events[0].event, 'TokenRemoved')
        assertSameAddress(events[0].args.token, anAddress)
        assert.equal(events[0].args.index, index)
      })
    })
  })

  describe('#transferGold()', () => {
    const aValue = 10000
    beforeEach(async () => {
      await mockGoldToken.setBalanceOf(reserve.address, aValue)
      await web3.eth.sendTransaction({ to: reserve.address, value: aValue, from: accounts[0] })
      await reserve.addSpender(spender)
    })

    it('should allow a spender to call transferGold', async () => {
      await reserve.transferGold(nonOwner, aValue, { from: spender })
    })

    it('should not allow a spender to transfer more than daily ratio', async () => {
      await reserve.setDailySpendingRatio(toFixed(0.2))
      await assertRevert(reserve.transferGold(nonOwner, aValue / 2, { from: spender }))
    })

    it('daily spending accumulates', async () => {
      await reserve.setDailySpendingRatio(toFixed(0.15))
      await reserve.transferGold(nonOwner, aValue * 0.1, { from: spender })
      await assertRevert(reserve.transferGold(nonOwner, aValue * 0.1, { from: spender }))
    })

    it('daily spending limit should be reset after 24 hours', async () => {
      await reserve.setDailySpendingRatio(toFixed(0.15))
      await reserve.transferGold(nonOwner, aValue * 0.1, { from: spender })
      await timeTravel(3600 * 24, web3)
      await reserve.transferGold(nonOwner, aValue * 0.1, { from: spender })
    })

    it('should not allow a removed spender to call transferGold', async () => {
      await reserve.removeSpender(spender)
      await assertRevert(reserve.transferGold(nonOwner, aValue, { from: spender }))
    })

    it('should not allow other addresses to call transferGold', async () => {
      await assertRevert(reserve.transferGold(nonOwner, aValue, { from: nonOwner }))
    })
  })

  describe('#getOrComputeTobinTax()', () => {
    let mockStableToken: MockStableTokenInstance

    const expectedNoTobinTax: [BN, BN] = [new BN(0), new BN(10).pow(new BN(24))]
    const expectedTobinTax: [BN, BN] = [
      new BN(5).mul(new BN(10).pow(new BN(21))),
      new BN(10).pow(new BN(24)),
    ]

    beforeEach(async () => {
      mockStableToken = await MockStableToken.new()
      await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
      await mockSortedOracles.setMedianRate(
        mockStableToken.address,
        sortedOraclesDenominator.times(10)
      )
      await reserve.addToken(mockStableToken.address)
      const reserveGoldBalance = new BigNumber(10).pow(19)
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: reserve.address,
        value: reserveGoldBalance,
      })
    })

    async function getOrComputeTobinTax(): Promise<[BN, BN]> {
      // @ts-ignore TODO(mcortesi): bad typings
      const tobinTax = await reserve.getOrComputeTobinTax.call()
      const actual = Object.keys(tobinTax).map((key) => web3.utils.toBN(tobinTax[key]))
      return actual as [BN, BN]
    }

    describe('when there is one stable token', () => {
      it('should set tobin tax to 0% when reserve gold balance > gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(19)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        const actual = await getOrComputeTobinTax()
        actual.forEach((v, i) => assert(expectedNoTobinTax[i].eq(v)))
      })

      it('should set tobin tax to 0% when reserve gold balance = gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(20)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        const actual = await getOrComputeTobinTax()
        actual.forEach((v, i) => assert(expectedNoTobinTax[i].eq(v)))
      })

      it('should set tobin tax to 0.5% when reserve gold balance < gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(21)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        const actual = await getOrComputeTobinTax()
        actual.forEach((v, i) => assert(expectedTobinTax[i].eq(v)))
      })
    })

    describe('when there are two stable tokens', () => {
      let anotherMockStableToken: MockStableTokenInstance
      beforeEach(async () => {
        anotherMockStableToken = await MockStableToken.new()
        await mockSortedOracles.setMedianRate(
          anotherMockStableToken.address,
          sortedOraclesDenominator.times(10)
        )
        await reserve.addToken(anotherMockStableToken.address)
      })

      it('should set tobin tax to 0% when reserve gold balance > gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(19)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        await anotherMockStableToken.setTotalSupply(stableTokenSupply)
        const actual = await getOrComputeTobinTax()
        actual.forEach((v, i) => assert(expectedNoTobinTax[i].eq(v)))
      })

      it('should set tobin tax to 0.5% when reserve gold balance < gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(21)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        await anotherMockStableToken.setTotalSupply(stableTokenSupply)
        const actual = await getOrComputeTobinTax()
        actual.forEach((v, i) => assert(expectedTobinTax[i].eq(v)))
      })

      it('should set tobin tax to 0.5% when reserve gold balance < gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10)
          .pow(new BN(20))
          .mul(new BN(6))
          .toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        await anotherMockStableToken.setTotalSupply(stableTokenSupply)
        const actual = await getOrComputeTobinTax()
        actual.forEach((v, i) => assert(expectedTobinTax[i].eq(v)))
      })
    })

    describe('when getOrComputeTobinTax() is called twice', () => {
      const tobinTaxStalenessThreshold = 3600
      let tobinTax1
      beforeEach(async () => {
        await reserve.setTobinTaxStalenessThreshold(tobinTaxStalenessThreshold)
        const stableTokenSupply1 = new BN(10).pow(new BN(21)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply1)
        await reserve.getOrComputeTobinTax()
        tobinTax1 = await getOrComputeTobinTax()
      })

      it('should get cached tobin tax value when called within staleness threshold', async () => {
        const stableTokenSupply2 = new BN(10).pow(new BN(19)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply2)
        await reserve.getOrComputeTobinTax()
        const tobinTax2 = await getOrComputeTobinTax()
        assert.deepEqual(tobinTax2, tobinTax1)
      })

      it('should get updated tobin tax value when called after staleness threshold is passed', async () => {
        await timeTravel(tobinTaxStalenessThreshold + 1, web3)
        const stableTokenSupply2 = new BN(10).pow(new BN(19)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply2)
        await reserve.getOrComputeTobinTax()
        const tobinTax2 = await getOrComputeTobinTax()
        assert.notDeepEqual(tobinTax2, tobinTax1)
      })
    })
  })

  describe('#setTobinTaxStalenessThreshold', () => {
    const newTobinTaxStalenessThreshold = 1
    it('should allow owner to set tobin tax staleness threshold', async () => {
      await reserve.setTobinTaxStalenessThreshold(newTobinTaxStalenessThreshold)
      assert.equal(
        (await reserve.tobinTaxStalenessThreshold()).toNumber(),
        newTobinTaxStalenessThreshold
      )
    })

    it('should not allow other users to set tobin tax staleness threshold', async () => {
      await assertRevert(
        reserve.setTobinTaxStalenessThreshold(newTobinTaxStalenessThreshold, { from: nonOwner })
      )
    })

    it('should emit a TobinTaxStalenessThresholdSet event', async () => {
      const response = await reserve.setTobinTaxStalenessThreshold(newTobinTaxStalenessThreshold)
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'TobinTaxStalenessThresholdSet')
      assert.equal(events[0].args.value, newTobinTaxStalenessThreshold)
    })
  })

  describe('#addOtherReserveAddress()', () => {
    it('should allow owner to add another reserve address', async () => {
      await reserve.addOtherReserveAddress(anAddress)
      assert.isTrue(await reserve.isOtherReserveAddress(anAddress))
    })

    it('should not allow other users to add another reserve address', async () => {
      await assertRevert(reserve.addOtherReserveAddress(anAddress, { from: nonOwner }))
    })

    it('should emit a OtherReserveAddressAdded event', async () => {
      const response = await reserve.addOtherReserveAddress(anAddress)
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'OtherReserveAddressAdded')
      assert.equal(events[0].args.otherReserveAddress.toLowerCase(), anAddress.toLowerCase())
    })

    describe('when another reserve address has already been added', async () => {
      beforeEach(async () => {
        await reserve.addOtherReserveAddress(anAddress)
      })

      it('should not allow owner to add an existing reserve address', async () => {
        await assertRevert(reserve.addOtherReserveAddress(anAddress))
      })
    })

    it('should incude the other reserve addresses in the reserve balance', async () => {
      await reserve.addOtherReserveAddress(anAddress)
      const otherReserveAddresses = await reserve.getOtherReserveAddresses()
      assert.equal(otherReserveAddresses.length, 1)
      assert.equal(otherReserveAddresses[0].toLowerCase(), anAddress.toLowerCase())

      const reserveGoldBalance = new BigNumber(10).pow(18).times(6)
      const otherReserveGoldBalance = new BigNumber(10).pow(18).times(4)
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: reserve.address,
        value: reserveGoldBalance,
      })
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: anAddress,
        value: otherReserveGoldBalance,
      })

      const reserveBalance = await reserve.getReserveGoldBalance()
      assertEqualBN(reserveBalance, reserveGoldBalance.plus(otherReserveGoldBalance))
    })
  })

  describe('#removeOtherReserveAddress()', () => {
    const index: number = 0

    it('should not allow owner to remove an unadded reserve address', async () => {
      await assertRevert(reserve.removeOtherReserveAddress(anAddress, index))
    })

    describe('when another reserve address has already been added', async () => {
      beforeEach(async () => {
        await reserve.addOtherReserveAddress(anAddress)
        const otherReserveAddresses = await reserve.getOtherReserveAddresses()
        assert.equal(otherReserveAddresses.length, 1)
        assert.equal(otherReserveAddresses[0].toLowerCase(), anAddress.toLowerCase())
      })

      it('should allow owner to remove another reserve address', async () => {
        await reserve.removeOtherReserveAddress(anAddress, index)
        assert.isFalse(await reserve.isOtherReserveAddress(anAddress))
        const otherReserveAddresses = await reserve.getOtherReserveAddresses()
        assert.equal(otherReserveAddresses.length, 0)
      })

      it('should not allow other users to remove another reserve address', async () => {
        await assertRevert(reserve.removeOtherReserveAddress(anAddress, index, { from: nonOwner }))
      })

      it('should emit a OtherReserveAddressRemoved event', async () => {
        const response = await reserve.removeOtherReserveAddress(anAddress, index)
        const events = response.logs
        assert.equal(events.length, 1)
        assert.equal(events[0].event, 'OtherReserveAddressRemoved')
        assertSameAddress(events[0].args.otherReserveAddress, anAddress)
        assert.equal(events[0].args.index, index)
      })
    })
  })

  describe('#setAssetAllocations', () => {
    const newAssetAllocationSymbols = [
      web3.utils.padRight(web3.utils.utf8ToHex('cGLD'), 64),
      web3.utils.padRight(web3.utils.utf8ToHex('BTC'), 64),
      web3.utils.padRight(web3.utils.utf8ToHex('ETH'), 64),
    ]
    const newAssetAllocationWeights = [
      new BigNumber(10)
        .pow(24)
        .dividedBy(new BigNumber(3))
        .integerValue()
        .plus(new BigNumber(1)),
      new BigNumber(10)
        .pow(24)
        .dividedBy(new BigNumber(3))
        .integerValue(),
      new BigNumber(10)
        .pow(24)
        .dividedBy(new BigNumber(3))
        .integerValue(),
    ]

    it('should allow owner to set asset allocations', async () => {
      await reserve.setAssetAllocations(newAssetAllocationSymbols, newAssetAllocationWeights)
      const assetAllocationSymbols = await reserve.getAssetAllocationSymbols()
      const assetAllocationWeights = await reserve.getAssetAllocationWeights()
      assert.equal(assetAllocationSymbols.length, newAssetAllocationSymbols.length)
      assert.equal(assetAllocationWeights.length, newAssetAllocationWeights.length)
      assert.equal(web3.utils.hexToUtf8(assetAllocationSymbols[0]), 'cGLD')
      assert.equal(web3.utils.hexToUtf8(assetAllocationSymbols[1]), 'BTC')
      assert.equal(web3.utils.hexToUtf8(assetAllocationSymbols[2]), 'ETH')
      assert.equal(newAssetAllocationWeights[0].isEqualTo(assetAllocationWeights[0]), true)
      assert.equal(newAssetAllocationWeights[1].isEqualTo(assetAllocationWeights[1]), true)
      assert.equal(newAssetAllocationWeights[2].isEqualTo(assetAllocationWeights[2]), true)
    })

    it('should not allow other users to set asset allocations', async () => {
      await assertRevert(
        reserve.setAssetAllocations(newAssetAllocationSymbols, newAssetAllocationWeights, {
          from: nonOwner,
        })
      )
    })

    it('should emit a AssetAllocationSet event', async () => {
      const response = await reserve.setAssetAllocations(
        newAssetAllocationSymbols,
        newAssetAllocationWeights
      )
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'AssetAllocationSet')
      assert.equal(events[0].args.symbols.length, 3)
      assert.equal(events[0].args.weights.length, 3)
      assert.equal(web3.utils.hexToUtf8(events[0].args.symbols[0]), 'cGLD')
      assert.equal(web3.utils.hexToUtf8(events[0].args.symbols[1]), 'BTC')
      assert.equal(web3.utils.hexToUtf8(events[0].args.symbols[2]), 'ETH')
      assert.equal(newAssetAllocationWeights[0].isEqualTo(events[0].args.weights[0]), true)
      assert.equal(newAssetAllocationWeights[1].isEqualTo(events[0].args.weights[1]), true)
      assert.equal(newAssetAllocationWeights[2].isEqualTo(events[0].args.weights[2]), true)
    })

    it("should fail if the asset allocation doesn't sum to one", async () => {
      const badAssetAllocationWeights = newAssetAllocationWeights
      badAssetAllocationWeights[0] = badAssetAllocationWeights[0].minus(1)
      await assertRevert(
        reserve.setAssetAllocations(newAssetAllocationSymbols, badAssetAllocationWeights)
      )
      const assetAllocationWeights = await reserve.getAssetAllocationWeights()
      assert.equal(assetAllocationWeights.length, 0)
    })
  })
})
