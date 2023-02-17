import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertGtBN, assertRevert, timeTravel } from '@celo/protocol/lib/test-utils'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ExchangeContract,
  ExchangeInstance,
  FeeBurnerContract,
  FeeBurnerInstance,
  FeeCurrencyWhitelistContract,
  FeeCurrencyWhitelistInstance,
  FreezerContract,
  FreezerInstance,
  GoldTokenContract,
  GoldTokenInstance,
  MockERC20Contract,
  MockERC20Instance,
  MockReserveContract,
  MockReserveInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  MockUniswapV2FactoryContract,
  MockUniswapV2FactoryInstance,
  MockUniswapV2Router02Contract,
  MockUniswapV2Router02Instance,
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
const maxSlippage = toFixed(1 / 100)
const initialReserveBalance = new BigNumber(10000000000000000000000)

const FeeBurner: FeeBurnerContract = artifacts.require('FeeBurner')
const Registry: RegistryContract = artifacts.require('Registry')
const Exchange: ExchangeContract = artifacts.require('Exchange')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockReserve: MockReserveContract = artifacts.require('MockReserve')

const StableToken: StableTokenContract = artifacts.require('StableToken')
const Freezer: FreezerContract = artifacts.require('Freezer')

const UniswapRouter: MockUniswapV2Router02Contract = artifacts.require('MockUniswapV2Router02')
const UniswapV2Factory: MockUniswapV2FactoryContract = artifacts.require('MockUniswapV2Factory')
const ERC20: MockERC20Contract = artifacts.require('MockERC20')

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')

contract('FeeBurner', (accounts: string[]) => {
  let feeBurner: FeeBurnerInstance
  let exchange: ExchangeInstance
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  // let dummyToken: StableTokenInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance
  let freezer: FreezerInstance

  let uniswapFactory: MockUniswapV2FactoryInstance
  let uniswapFactory2: MockUniswapV2FactoryInstance
  let uniswap: MockUniswapV2Router02Instance
  let uniswap2: MockUniswapV2Router02Instance
  let tokenA: MockERC20Instance

  let deadline: number

  let feeCurrencyWhitelist: FeeCurrencyWhitelistInstance

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
    deadline = (await web3.eth.getBlock('latest')).timestamp + 100
    goldToken = await GoldToken.new(true)
    mockReserve = await MockReserve.new()
    stableToken = await StableToken.new(true)
    registry = await Registry.new(true)
    feeBurner = await FeeBurner.new(true)
    freezer = await Freezer.new(true)
    feeCurrencyWhitelist = await FeeCurrencyWhitelist.new(true)

    tokenA = await ERC20.new()
    await feeCurrencyWhitelist.initialize()

    uniswapFactory = await UniswapV2Factory.new('0x0000000000000000000000000000000000000000') // feeSetter
    // console.log('hash', await uniswapFactory.INIT_CODE_PAIR_HASH())
    uniswap = await UniswapRouter.new(
      uniswapFactory.address,
      '0x0000000000000000000000000000000000000000'
    ) // _factory, _WETH

    uniswapFactory2 = await UniswapV2Factory.new('0x0000000000000000000000000000000000000000') // feeSetter

    uniswap2 = await UniswapRouter.new(
      uniswapFactory2.address,
      '0x0000000000000000000000000000000000000000'
    ) // _factory, _WETH

    await registry.setAddressFor(
      CeloContractName.FeeCurrencyWhitelist,
      feeCurrencyWhitelist.address
    )
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

    await feeBurner.initialize(
      registry.address,
      [stableToken.address, tokenA.address],
      [new BigNumber(1000000e18), new BigNumber(1000001e18)],
      [toFixed(1), toFixed(1)], // 100% slippage, virtually no limit
      ['0x0000000000000000000000000000000000000000', uniswap.address]
    )
  })

  describe('#transfer()', () => {
    beforeEach(async () => {
      await tokenA.mint(feeBurner.address, new BigNumber(1e18))
    })

    it('Only owner can take tokens out', async () => {
      await assertRevert(
        feeBurner.transfer(tokenA.address, user, new BigNumber(1e18), { from: user })
      )
    })

    it('Can take funds out', async () => {
      await feeBurner.transfer(tokenA.address, user, new BigNumber(1e18))
      assertEqualBN(await tokenA.balanceOf(user), new BigNumber(1e18))
    })
  })

  describe('#initialize()', () => {
    it('set the right parameters', async () => {
      assertEqualBN(await feeBurner.maxSlippage(stableToken.address), toFixed(1))
      assertEqualBN(await feeBurner.maxSlippage(tokenA.address), toFixed(1))
      assertEqualBN(await feeBurner.dailyBurnLimit(stableToken.address), new BigNumber(1000000e18))
      assertEqualBN(await feeBurner.dailyBurnLimit(tokenA.address), new BigNumber(1000001e18))
      // assert((await feeBurner.getRouterForToken(stableToken.address)) == [])  // can't get this to work
      assert((await feeBurner.routerAddresses(tokenA.address, 0)) == uniswap.address)
    })

    it('should have set the owner', async () => {
      const owner: string = await feeBurner.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(feeBurner.initialize(registry.address, [], [], [], [], { from: user }))
    })
  })

  describe('#removeExchange()', () => {
    it('removes a token', async () => {
      await feeBurner.removeExchange(tokenA.address, uniswap.address, 0)

      // Todo check the list here
      // TODO check with more items
    })
  })

  describe('#setDailyBurnLimit()', () => {
    it('should only be called by owner', async () => {
      await assertRevert(
        feeBurner.setDailyBurnLimit(stableToken.address, goldAmountForRate, { from: user })
      )
    })
  })

  describe('#setMaxSplipagge()', () => {
    it('should only be called by owner', async () => {
      await assertRevert(
        feeBurner.setMaxSplipagge(stableToken.address, maxSlippage, { from: user })
      )
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

      // burn for a token is zero
      assertEqualBN(await feeBurner.getPastBurnForToken(stableToken.address), new BigNumber(0))

      const burnedAmountStable = await stableToken.balanceOf(feeBurner.address)

      await feeBurner.burn()

      assertEqualBN(await feeBurner.getPastBurnForToken(stableToken.address), burnedAmountStable)

      // all Celo must have been burned
      assertEqualBN(await goldToken.balanceOf(feeBurner.address), new BigNumber(0))
      // all stable must have been burned
      assertEqualBN(await stableToken.balanceOf(feeBurner.address), new BigNumber(0))

      // get some Celo dollars
      // Send to burner
      // burn
    })

    it("doesn't burn when bigger than limit", async () => {
      await feeBurner.setDailyBurnLimit(stableToken.address, new BigNumber(1000))

      await stableToken.transfer(feeBurner.address, new BigNumber(3000), {
        from: user,
      })

      await feeBurner.burn()

      assertEqualBN(await stableToken.balanceOf(feeBurner.address), new BigNumber(2000))

      // burning again shouldn't do anything
      await feeBurner.burn()
      assertEqualBN(await stableToken.balanceOf(feeBurner.address), new BigNumber(2000))
    })

    it("doesn't burn when slippage is too big", async () => {
      await feeBurner.setMaxSplipagge(stableToken.address, toFixed(1 / 1e6)) // TODO do the math to get the right threshold

      await stableToken.transfer(feeBurner.address, new BigNumber(3000), {
        from: user,
      })

      await assertRevert(feeBurner.burn())

      assertEqualBN(await stableToken.balanceOf(feeBurner.address), new BigNumber(3000))
    })

    it('reset burn limit after 24 hours', async () => {
      await feeBurner.setDailyBurnLimit(stableToken.address, new BigNumber(1000))

      await stableToken.transfer(feeBurner.address, new BigNumber(3000), {
        from: user,
      })

      await feeBurner.burn()
      await timeTravel(3600 * 24, web3)
      await feeBurner.burn()

      assertEqualBN(await stableToken.balanceOf(feeBurner.address), new BigNumber(1000))
    })

    it("doesn't burn when balance is low", async () => {
      await stableToken.transfer(feeBurner.address, new BigNumber(await feeBurner.MIN_BURN()), {
        from: user,
      })

      const balanceBefore = await stableToken.balanceOf(feeBurner.address)

      await feeBurner.burn()

      assertEqualBN(await stableToken.balanceOf(feeBurner.address), balanceBefore)
    })

    it('sets pool for exchange', async () => {
      // TODO change for UNISWAP address
      await feeBurner.setRouter(stableToken.address, uniswap.address)

      assert(await feeBurner.routerAddresses(stableToken.address, 0), uniswap.address)
      // await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
    })
  })
  describe('#burnNonMentoAssets()', () => {
    beforeEach(async () => {
      feeCurrencyWhitelist.addNonMentoToken(tokenA.address)
      await feeBurner.setRouter(tokenA.address, uniswap.address)
      await tokenA.mint(feeBurner.address, new BigNumber(10e18))
      await tokenA.mint(user, new BigNumber(10e18))
      await goldToken.transfer(user, new BigNumber(10e18))
      const toTransfer = new BigNumber(5e18)

      await tokenA.approve(uniswap.address, toTransfer, { from: user })
      await goldToken.approve(uniswap.address, toTransfer, { from: user })

      await uniswap.addLiquidity(
        tokenA.address,
        goldToken.address,
        toTransfer,
        toTransfer,
        toTransfer,
        toTransfer,
        user,
        deadline,
        { from: user }
      )
    })

    it('Uniswap trade test', async () => {
      // Make sure our uniswap mock works

      const balanceAbefore = await tokenA.balanceOf(user)
      const balanceBbefore = await goldToken.balanceOf(user)

      await tokenA.approve(uniswap.address, new BigNumber(1e18), { from: user })
      await uniswap.swapExactTokensForTokens(
        new BigNumber(1e18),
        0,
        [tokenA.address, goldToken.address],
        user,
        deadline,
        { from: user }
      )

      assertGtBN(balanceAbefore, await tokenA.balanceOf(user))
      assertGtBN(await goldToken.balanceOf(user), balanceBbefore)
    })

    it('Burns non-Mento tokens', async () => {
      await tokenA.mint(user, new BigNumber(10e18))

      // safety check, check that the balance is no empty before the burn
      await assertGtBN(await tokenA.balanceOf(feeBurner.address), 0)
      await feeBurner.burnNonMentoTokens()

      assertEqualBN(await tokenA.balanceOf(feeBurner.address), 0)
    })

    it("Doesn't burn Mento tokens if the limit is hit", async () => {
      await feeBurner.setDailyBurnLimit(tokenA.address, new BigNumber(1e18))
      await feeBurner.burnNonMentoTokens()

      assertEqualBN(await tokenA.balanceOf(feeBurner.address), new BigNumber(9e18))
      await feeBurner.burnNonMentoTokens()
      assertEqualBN(await tokenA.balanceOf(feeBurner.address), new BigNumber(9e18))

      await timeTravel(3600 * 24, web3)
      await feeBurner.burnNonMentoTokens()

      assertEqualBN(await tokenA.balanceOf(feeBurner.address), new BigNumber(8e18))
    })

    it("Doesn't exchange non-Mento when slippage is too high", async () => {
      await feeBurner.setMaxSplipagge(tokenA.address, maxSlippage)
      await assertRevert(feeBurner.burnNonMentoTokens())

      assertEqualBN(await tokenA.balanceOf(feeBurner.address), new BigNumber(10e18))
    })

    it('Tries to get the best rate with many exchanges', async () => {
      await feeBurner.setRouter(tokenA.address, uniswap2.address)
      await tokenA.mint(user, new BigNumber(10e18))

      // safety check, check that the balance is no empty before the burn
      await assertGtBN(await tokenA.balanceOf(feeBurner.address), 0)

      const toTransfer = new BigNumber(10e18) // make uniswap2 bigger, so it should get used

      await tokenA.approve(uniswap2.address, toTransfer, { from: user })
      await goldToken.approve(uniswap2.address, toTransfer, { from: user })

      await uniswap2.addLiquidity(
        tokenA.address,
        goldToken.address,
        toTransfer,
        toTransfer,
        toTransfer,
        toTransfer,
        user,
        deadline,
        { from: user }
      )

      const quote1before = (
        await uniswap.getAmountsOut(new BigNumber(1e18), [tokenA.address, goldToken.address])
      )[1]
      const quote2before = (
        await uniswap2.getAmountsOut(new BigNumber(1e18), [tokenA.address, goldToken.address])
      )[1]

      await feeBurner.burnNonMentoTokens()

      // liquidity should have been taken by the uniswap2, because it has better liquidity, and thust higher quite
      // so the quote gets worse (smaller number)

      const quote1after = (
        await uniswap.getAmountsOut(new BigNumber(1e18), [tokenA.address, goldToken.address])
      )[1]
      const quote2after = (
        await uniswap2.getAmountsOut(new BigNumber(1e18), [tokenA.address, goldToken.address])
      )[1]

      assertEqualBN(quote1before, quote1after) // uniswap 1 should be untouched
      assertGtBN(quote2before, quote2after)

      assertEqualBN(await tokenA.balanceOf(feeBurner.address), 0) // check that it burned
    })
  })
})
