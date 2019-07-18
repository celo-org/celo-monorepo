import { goldTokenRegistryId, sortedOraclesRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertRevert,
  assertSameAddress,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  MockGoldTokenInstance,
  MockSortedOraclesInstance,
  MockStableTokenInstance,
  RegistryInstance,
  ReserveInstance,
} from 'types'
import BN = require('bn.js')

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

  beforeEach(async () => {
    reserve = await Reserve.new()
    registry = await Registry.new()
    mockSortedOracles = await MockSortedOracles.new()
    mockGoldToken = await MockGoldToken.new()
    await registry.setAddressFor(sortedOraclesRegistryId, mockSortedOracles.address)
    await registry.setAddressFor(goldTokenRegistryId, mockGoldToken.address)
    await reserve.initialize(registry.address, aTobinTaxStalenessThreshold)
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
      await assertRevert(reserve.initialize(registry.address, aTobinTaxStalenessThreshold))
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
      await mockSortedOracles.setMedianRate(anAddress, 1, 1)
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

    it('should revert when the token does not have an exchange rate with gold', async () => {
      await assertRevert(reserve.addToken(web3.utils.randomHex(20)))
    })

    describe('when the token has already been added', async () => {
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

    describe('when the token has already been added', async () => {
      beforeEach(async () => {
        await mockSortedOracles.setMedianRate(anAddress, 1, 1)
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
    const aValue = 10
    beforeEach(async () => {
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: reserve.address,
        value: aValue,
      })
      await reserve.addSpender(spender)
    })

    it('should allow a spender to call transferGold', async () => {
      await reserve.transferGold(nonOwner, aValue, { from: spender })
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

    beforeEach(async () => {
      mockStableToken = await MockStableToken.new()
      await registry.setAddressFor(sortedOraclesRegistryId, mockSortedOracles.address)
      await mockSortedOracles.setMedianRate(mockStableToken.address, 10, 1)
      await reserve.addToken(mockStableToken.address)
      const reserveGoldBalance = new BigNumber(10).pow(19)
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: reserve.address,
        value: reserveGoldBalance,
      })
    })

    async function getOrComputeTobinTax(): Promise<[number, number]> {
      // @ts-ignore TODO(mcortesi): bad typings
      const tobinTax = await reserve.getOrComputeTobinTax.call()
      const actual = Object.keys(tobinTax).map((key) => tobinTax[key].toNumber())
      return actual as [number, number]
    }

    describe('when there is one stable token', () => {
      it('should set tobin tax to 0% when reserve gold balance > gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(19)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        const expected: [number, number] = [0, 1000]
        assert.deepEqual(await getOrComputeTobinTax(), expected)
      })

      it('should set tobin tax to 0% when reserve gold balance = gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(20)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        const expected: [number, number] = [0, 1000]
        assert.deepEqual(await getOrComputeTobinTax(), expected)
      })

      it('should set tobin tax to 0.5% when reserve gold balance < gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(21)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        const expected: [number, number] = [5, 1000]
        assert.deepEqual(await getOrComputeTobinTax(), expected)
      })
    })

    describe('when there are two stable tokens', () => {
      let anotherMockStableToken: MockStableTokenInstance
      beforeEach(async () => {
        anotherMockStableToken = await MockStableToken.new()
        await mockSortedOracles.setMedianRate(anotherMockStableToken.address, 10, 1)
        await reserve.addToken(anotherMockStableToken.address)
      })

      it('should set tobin tax to 0% when reserve gold balance > gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(19)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        await anotherMockStableToken.setTotalSupply(stableTokenSupply)
        const expected: [number, number] = [0, 1000]
        assert.deepEqual(await getOrComputeTobinTax(), expected)
      })

      it('should set tobin tax to 0.5% when reserve gold balance < gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10).pow(new BN(21)).toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        await anotherMockStableToken.setTotalSupply(stableTokenSupply)
        const expected: [number, number] = [5, 1000]
        assert.deepEqual(await getOrComputeTobinTax(), expected)
      })

      it('should set tobin tax to 0.5% when reserve gold balance < gold value of floating stable tokens', async () => {
        const stableTokenSupply = new BN(10)
          .pow(new BN(20))
          .mul(new BN(6))
          .toString()
        await mockStableToken.setTotalSupply(stableTokenSupply)
        await anotherMockStableToken.setTotalSupply(stableTokenSupply)
        const expected: [number, number] = [5, 1000]
        assert.deepEqual(await getOrComputeTobinTax(), expected)
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
})
