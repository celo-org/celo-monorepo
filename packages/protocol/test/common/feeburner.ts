import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertGtBN, assertRevert, timeTravel } from '@celo/protocol/lib/test-utils'
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

contract('FeeBurner', (accounts: string[]) => {
  let feeBurner: FeeBurnerInstance
  let exchange: ExchangeInstance
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  let dummyToken: StableTokenInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance
  let freezer: FreezerInstance

  let uniswapFactory: MockUniswapV2FactoryInstance
  let uniswap: MockUniswapV2Router02Instance
  let tokenA: MockERC20Instance
  let tokenB: MockERC20Instance

  let deadline: number

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
    dummyToken = await StableToken.new(true)
    registry = await Registry.new(true)
    feeBurner = await FeeBurner.new(true)
    freezer = await Freezer.new(true)

    uniswapFactory = await UniswapV2Factory.new('0x0000000000000000000000000000000000000000') // feeSetter
    console.log('hash', await uniswapFactory.INIT_CODE_PAIR_HASH())
    // 0x2bfd701f0ec7fe6631627822d4675473606aaf94b22b804c1c02b8414810bfd4
    uniswap = await UniswapRouter.new(
      uniswapFactory.address,
      '0x0000000000000000000000000000000000000000'
    ) // _factory, _WETH

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
      await assertRevert(feeBurner.initialize(registry.address, { from: user }))
    })
  })

  describe('#setDailyBurnLimit()', () => {
    it('should only be called by owner', async () => {
      await assertRevert(
        feeBurner.setDailyBurnLimit(stableToken.address, goldAmountForRate, { from: user })
      )
    })
  })

  describe('#setDailyBurnLimit()', () => {
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

      // console.log('balance of user is', (await stableToken.balanceOf(user)).toString())
      // console.log(
      //   'balance of contract is',
      //   (await stableToken.balanceOf(feeBurner.address)).toString()
      // )

      const burnedAmountStable = await stableToken.balanceOf(feeBurner.address)

      await feeBurner.burn()

      assertEqualBN(await feeBurner.getPastBurnForToken(stableToken.address), burnedAmountStable)

      // all Celo must have been burned
      assertEqualBN(await goldToken.balanceOf(feeBurner.address), new BigNumber(0))
      console.log(6)
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
      await feeBurner.setExchange(dummyToken.address, dummyToken.address, dummyToken.address)

      assert(await feeBurner.poolAddresses(dummyToken.address, 0), dummyToken.address)
      // await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
    })

    it.only('Uniswap trade test', async () => {
      // Make sure our uniswap mock works

      tokenA = await ERC20.new()
      tokenB = await ERC20.new()
      await tokenA.mint(user, new BigNumber(10e18))
      await tokenB.mint(user, new BigNumber(10e18))

      const toTransfer = new BigNumber(5e18)

      await tokenA.approve(uniswap.address, toTransfer, { from: user })
      await tokenB.approve(uniswap.address, toTransfer, { from: user })

      await uniswap.addLiquidity(
        tokenA.address,
        tokenB.address,
        toTransfer,
        toTransfer,
        toTransfer,
        toTransfer,
        user,
        deadline,
        { from: user }
      )

      const balanceAbefore = await tokenA.balanceOf(user)
      const balanceBbefore = await tokenB.balanceOf(user)

      await tokenA.approve(uniswap.address, new BigNumber(1e18), { from: user })
      await uniswap.swapExactTokensForTokens(
        new BigNumber(1e18),
        0,
        [tokenA.address, tokenB.address],
        user,
        deadline,
        { from: user }
      )

      console.log('balanceAbefore', balanceAbefore)
      console.log('balanceAbefore', balanceBbefore)
      console.log('await tokenA.balanceOf(user)', await tokenA.balanceOf(user))
      console.log('await tokenB.balanceOf(user)', await tokenB.balanceOf(user))

      assertGtBN(balanceAbefore, await tokenA.balanceOf(user))
      assertGtBN(await tokenB.balanceOf(user), balanceBbefore)
      // console.log((await tokenA.balanceOf(user)).toString())
      // console.log((await tokenB.balanceOf(user)).toString())

      // assert(false)
    })
  })
})
