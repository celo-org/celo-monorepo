import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertRevert } from '@celo/protocol/lib/test-utils'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ExchangeContract,
  ExchangeInstance,
  FeeBurnerContract,
  FeeBurnerInstance,
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
import { SECONDS_IN_A_WEEK } from '../constants'

const goldAmountForRate = new BigNumber('1000000000000000000000000')
const stableAmountForRate = new BigNumber(2).times(goldAmountForRate)
const spread = toFixed(3 / 1000)
const reserveFraction = toFixed(5 / 100)
const initialReserveBalance = new BigNumber(10000000000000000000000)

const FeeBurner: FeeBurnerContract = artifacts.require('FeeBurner')
const Registry: RegistryContract = artifacts.require('Registry')
const Exchange: ExchangeContract = artifacts.require('Exchange')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockReserve: MockReserveContract = artifacts.require('MockReserve')

const StableToken: StableTokenContract = artifacts.require('StableToken')
const Freezer: FreezerContract = artifacts.require('Freezer')

contract('FeeBurner', (accounts: string[]) => {
  let feeBurner: FeeBurnerInstance
  let exchange: ExchangeInstance
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance
  let freezer: FreezerInstance

  // const aTokenAddress = '0x000000000000000000000000000000000000ce10'

  // const nonOwner = accounts[1]

  const decimals = 18
  const updateFrequency = 60 * 60
  const minimumReports = 2

  async function fundReserve() {
    // Would have used goldToken here, but ran into issues of inability to transfer
    // TODO: Remove in https://github.com/celo-org/celo-monorepo/issues/2000
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: mockReserve.address,
      value: initialReserveBalance.toString(),
    })
  }

  const user = accounts[1]

  beforeEach(async () => {
    goldToken = await GoldToken.new(true)
    mockReserve = await MockReserve.new()
    stableToken = await StableToken.new(true)
    registry = await Registry.new(true)
    feeBurner = await FeeBurner.new(true)
    freezer = await Freezer.new(true)

    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)

    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)
    await registry.setAddressFor(CeloContractName.Reserve, mockReserve.address)
    await mockReserve.setGoldToken(goldToken.address)
    await mockReserve.addToken(stableToken.address)

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
      [],
      CeloContractName.Exchange // USD
    )

    mockSortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
    await mockSortedOracles.setMedianRate(stableToken.address, stableAmountForRate)
    await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
    await mockSortedOracles.setNumRates(stableToken.address, 2)

    await fundReserve()

    exchange = await Exchange.new(true)
    await exchange.initialize(
      registry.address,
      CeloContractName.StableToken,
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    )

    await registry.setAddressFor(CeloContractName.StableToken, stableToken.address)
    await registry.setAddressFor(CeloContractName.Exchange, exchange.address)
    await exchange.activateStable()

    await feeBurner.initialize(registry.address)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await feeBurner.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(feeBurner.initialize(registry.address))
    })
  })

  describe('#burnMentoAssets()', () => {
    beforeEach(async () => {
      const goldTokenAmount = new BigNumber(1e18)

      await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      await exchange.sell(goldTokenAmount, 0, true, { from: user })
    })

    it('burns with balance', async () => {
      await stableToken.transfer(feeBurner.address, await stableToken.balanceOf(user), {
        from: user,
      })

      console.log('balance of user is', (await stableToken.balanceOf(user)).toString())
      console.log(
        'balance of contract is',
        (await stableToken.balanceOf(feeBurner.address)).toString()
      )

      await feeBurner.burn()

      // all Celo must have been burned
      assertEqualBN(await goldToken.balanceOf(feeBurner.address), new BigNumber(0))
      console.log(6)
      // all stable must have been burned
      assertEqualBN(await stableToken.balanceOf(feeBurner.address), new BigNumber(0))

      // get some Celo dollars
      // Send to burner
      // burn
    })

    it("doesn't burrn when balance is low", async () => {
      const balanceBefore = await stableToken.balanceOf(feeBurner.address)
      await stableToken.transfer(feeBurner.address, new BigNumber(await feeBurner.MIN_BURN()), {
        from: user,
      })

      await feeBurner.burn()

      assertEqualBN(await stableToken.balanceOf(feeBurner.address), balanceBefore)
    })

    it("doesn't exchange in case of big slipage", async () => {
      // await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
    })
  })
})