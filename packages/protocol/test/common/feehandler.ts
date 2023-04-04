/* tslint:disable */

// TODO remove magic numbers
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertGtBN, assertRevert, timeTravel } from '@celo/protocol/lib/test-utils'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ExchangeContract,
  ExchangeInstance,
  FeeCurrencyWhitelistContract,
  FeeCurrencyWhitelistInstance,
  FeeHandlerContract,
  FeeHandlerInstance,
  FreezerContract,
  FreezerInstance,
  GoldTokenContract,
  GoldTokenInstance,
  MentoFeeHandlerSellerContract,
  MentoFeeHandlerSellerInstance,
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
import { SECONDS_IN_A_WEEK, ZERO_ADDRESS } from '../constants'

const goldAmountForRate = new BigNumber('1000000000000000000000000')
const stableAmountForRate = new BigNumber(2).times(goldAmountForRate)
const spread = toFixed(3 / 1000)
const reserveFraction = toFixed(5 / 100)
const maxSlippage = toFixed(1 / 100)
const initialReserveBalance = new BigNumber('10000000000000000000000')

const FeeHandler: FeeHandlerContract = artifacts.require('FeeHandler')
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

const MentoFeeHandlerSeller: MentoFeeHandlerSellerContract = artifacts.require(
  'MentoFeeHandlerSeller'
)

const EXAMPLE_BENEFICIARY_ADDRESS = '0x2A486910DBC72cACcbb8d0e1439C96b03B2A4699'

contract('FeeHandler', (accounts: string[]) => {
  let feeHandler: FeeHandlerInstance
  let exchange: ExchangeInstance
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance
  let freezer: FreezerInstance
  let mentoSeller: MentoFeeHandlerSellerInstance

  let uniswapFactory: MockUniswapV2FactoryInstance
  let uniswapFactory2: MockUniswapV2FactoryInstance
  let uniswap: MockUniswapV2Router02Instance
  let uniswap2: MockUniswapV2Router02Instance
  let tokenA: MockERC20Instance

  let deadline: number

  let feeCurrencyWhitelist: FeeCurrencyWhitelistInstance

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
    feeHandler = await FeeHandler.new(true)
    freezer = await Freezer.new(true)
    feeCurrencyWhitelist = await FeeCurrencyWhitelist.new(true)
    mentoSeller = await MentoFeeHandlerSeller.new(true)

    tokenA = await ERC20.new()
    await feeCurrencyWhitelist.initialize()

    uniswapFactory = await UniswapV2Factory.new('0x0000000000000000000000000000000000000000') // feeSetter

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

    await mentoSeller.initialize(registry.address)

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

    await feeHandler.initialize(
      registry.address,
      [stableToken.address, tokenA.address],
      [new BigNumber(1000000e18), new BigNumber(1000001e18)],
      [toFixed(1), toFixed(1)], // 100% slippage, virtually no limit
      ['0x0000000000000000000000000000000000000000', uniswap.address]
    )
  })

  describe('#setBurnFraction()', () => {
    it('updates burn fraction correctly', async () => {
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      assertEqualBN(await feeHandler.burnFraction(), toFixed(80 / 100))
    })

    it('only allows owner to change the burn fraction', async () => {
      await assertRevert(feeHandler.setBurnFraction(toFixed(80 / 100), { from: user }))
    })

    it("doesn't allow numbers bigger than one", async () => {
      await assertRevert(feeHandler.setBurnFraction(toFixed(80 / 100), { from: user }))
    })
  })

  describe('#setFeeBeneficiary()', () => {
    it('updates address correctly', async () => {
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
      assert(await feeHandler.feeBeneficiary(), EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it('only allows owner to change the burn fraction', async () => {
      await assertRevert(feeHandler.setBurnFraction(EXAMPLE_BENEFICIARY_ADDRESS, { from: user }))
    })

    it("doesn't allow the zero address", async () => {
      await assertRevert(feeHandler.setFeeBeneficiary(ZERO_ADDRESS))
    })
  })

  describe('#distribute()', () => {
    beforeEach(async () => {
      const goldTokenAmount = new BigNumber(1e18)

      await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      await exchange.sell(goldTokenAmount, 0, true, { from: user })
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })

      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
      await feeHandler.sell(stableToken.address)
    })

    it('distributes after a burn', async () => {
      await feeHandler.distribute(stableToken.address)
      assertEqualBN(await stableToken.balanceOf(feeHandler.address), 0)
      assertEqualBN(
        await stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS),
        new BigNumber('0.2e18')
      )
    })
  })

  describe.only('#burnCelo()', () => {
    beforeEach(async () => {
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      console.log('balance 1', (await goldToken.balanceOf(feeHandler.address)).toString())
      await goldToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })

      console.log('balance 2', (await goldToken.balanceOf(feeHandler.address)).toString())
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
      // assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber("0")) // balance should start as zero
    })

    it('distribute correctly', async () => {
      console.log('balance 4', (await goldToken.balanceOf(feeHandler.address)).toString())
      await feeHandler.burnCelo()
      // await feeHandler.distribute(stableToken.address)
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18'))
    })

    it('burns correctly', async () => {
      console.log('balance 3', (await goldToken.balanceOf(feeHandler.address)).toString())
      await feeHandler.burnCelo()
      // await feeHandler.distribute(stableToken.address)
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18'))
    })

    // it("Doesn't burn what it's pending distributio", async () => {
    //   console.log("balance 4", (await goldToken.balanceOf(feeHandler.address)).toString())
    //   await feeHandler.burnCelo();
    //   // await feeHandler.distribute(stableToken.address)
    //   console.log("toDistribute", ((await feeHandler.tokenStates(goldToken.address))[5]).toString())
    //   assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber("0.2e18"))
    //   assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber("0.8e18"))

    //   console.log("here")
    //   await feeHandler.burnCelo();
    //   assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber("0.2e18"))
    //   assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber("0.8e18"))
    // })

    it('distributes correcly after a burn', async () => {
      console.log('balance 5', (await goldToken.balanceOf(feeHandler.address)).toString())
      await feeHandler.burnCelo()
      // await feeHandler.distribute(stableToken.address)
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      await feeHandler.distribute(goldToken.address)
      assertEqualBN(await goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), new BigNumber('0.2e18'))
    })
  })

  describe('#sell()', () => {
    beforeEach(async () => {
      const goldTokenAmount = new BigNumber(1e18)

      await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      await exchange.sell(goldTokenAmount, 0, true, { from: user })
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.setBurnFraction(toFixed(80 / 100))
    })

    it('burns with mento', async () => {
      console.log(1)
      console.log('balance of user is', (await stableToken.balanceOf(user)).toString())
      await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })
      console.log(2)
      assertEqualBN(await feeHandler.getPastBurnForToken(stableToken.address), 0)
      console.log(3)
      const burnedAmountStable = await stableToken.balanceOf(feeHandler.address)
      console.log(4)
      await feeHandler.sell(stableToken.address)
      console.log(5)
      assertEqualBN(
        await feeHandler.getPastBurnForToken(stableToken.address),
        new BigNumber(burnedAmountStable).multipliedBy('0.8')
      )
      console.log(6)
      assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      console.log(7)
      // assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber("994020886585092876"))
      assertEqualBN((await feeHandler.tokenStates(stableToken.address))[5], new BigNumber('0.2e18'))

      console.log(8)
    })

    it("Doesn't burn balance if it hasn't distributed", async () => {
      await stableToken.transfer(
        feeHandler.address,
        //  await stableToken.balanceOf(user),
        new BigNumber('1e18'),
        {
          from: user,
        }
      )
      await feeHandler.sell(stableToken.address)
      console.log(1)
      const balanceFefore = await stableToken.balanceOf(feeHandler.address)
      console.log(
        '(await feeHandler.tokenStates(stableToken.address))[5]',
        (await feeHandler.tokenStates(stableToken.address))[5].toString()
      )
      console.log(
        '(await stableToken.balanceOf(feeHandler.address)',
        (await stableToken.balanceOf(feeHandler.address)).toString()
      )
      await feeHandler.sell(stableToken.address)
      console.log(2)
      assertEqualBN(balanceFefore, await stableToken.balanceOf(feeHandler.address))
    })
  })

  describe('#handle()', () => {
    beforeEach(async () => {
      // const goldTokenAmount = new BigNumber(1e18)

      // await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      // await exchange.sell(goldTokenAmount, 0, true, { from: user })
      // await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await goldToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it('handles Celo', async () => {
      // basically it just does a burn
      await feeHandler.handle(goldToken.address)
      assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18'))
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
    })

    // it("Handles other tokens", async () => {

    // })
  })
  describe('#calculateMinAmount()', () => {
    it('calculated the min correclty', async () => {
      const midprice = new BigNumber('1e18') // (1 Stabletoken = 1 Celo)
      const amount = new BigNumber('10e18')

      await feeHandler.setMaxSplippage(stableToken.address, toFixed(2 / 100))
      assertEqualBN(
        await feeHandler.calculateMinAmount(
          midprice,
          new BigNumber('1e18'),
          stableToken.address,
          amount
        ),
        new BigNumber('9.8e18')
      )
    })
  })

  describe('#transfer()', () => {
    beforeEach(async () => {
      await tokenA.mint(feeHandler.address, new BigNumber(1e18))
    })

    it('Only owner can take tokens out', async () => {
      await assertRevert(
        feeHandler.transfer(tokenA.address, user, new BigNumber(1e18), { from: user })
      )
    })

    it('Can take funds out', async () => {
      await feeHandler.transfer(tokenA.address, user, new BigNumber(1e18))
      assertEqualBN(await tokenA.balanceOf(user), new BigNumber(1e18))
    })
  })

  describe('#initialize()', () => {
    it('set the right parameters', async () => {
      assertEqualBN(await feeHandler.maxSlippage(stableToken.address), toFixed(1))
      assertEqualBN(await feeHandler.maxSlippage(tokenA.address), toFixed(1))
      assertEqualBN(await feeHandler.dailyBurnLimit(stableToken.address), new BigNumber(1000000e18))
      assertEqualBN(await feeHandler.dailyBurnLimit(tokenA.address), new BigNumber(1000001e18))
      expect((await feeHandler.getRoutersForToken(tokenA.address)).toString()).to.equal(
        [uniswap.address].toString()
      )
      expect(await feeHandler.routerAddresses(tokenA.address, 0)).to.equal(uniswap.address)
    })

    it('should have set the owner', async () => {
      const owner: string = await feeHandler.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(feeHandler.initialize(registry.address, [], [], [], [], { from: user }))
    })
  })

  describe('#setRouter()', () => {
    it('sets pool for exchange', async () => {
      await feeHandler.setRouter(tokenA.address, uniswap.address)

      assert(await feeHandler.routerAddresses(tokenA.address, 0), uniswap.address)
    })
  })

  describe('#removeRouter()', () => {
    it('removes a token', async () => {
      await feeHandler.removeRouter(tokenA.address, uniswap.address, 0)
      expect((await feeHandler.getRoutersForToken(tokenA.address)).toString()).to.equal(
        [].toString()
      )
    })

    it('removes when list is big', async () => {
      await feeHandler.setRouter(tokenA.address, exchange.address)
      await feeHandler.setRouter(tokenA.address, stableToken.address)
      // list for token should be [uniswap, exchange, stabletoken]
      await feeHandler.removeRouter(tokenA.address, exchange.address, 1)
      expect((await feeHandler.getRoutersForToken(tokenA.address)).toString()).to.equal(
        [uniswap.address, stableToken.address].toString()
      )
    })

    it("doesn't remove if the indexes doesn't match", async () => {
      await assertRevert(feeHandler.removeRouter(tokenA.address, exchange.address, 0))
    })
  })

  describe('#setDailyBurnLimit()', () => {
    it('should only be called by owner', async () => {
      await assertRevert(
        feeHandler.setDailyBurnLimit(stableToken.address, goldAmountForRate, { from: user })
      )
    })
  })

  describe('#setMaxSplipagge()', () => {
    it('should only be called by owner', async () => {
      await assertRevert(
        feeHandler.setMaxSplippage(stableToken.address, maxSlippage, { from: user })
      )
    })
  })

  describe('#burnMentoTokens()', () => {
    beforeEach(async () => {
      const goldTokenAmount = new BigNumber(1e18)

      await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      await exchange.sell(goldTokenAmount, 0, true, { from: user })
    })

    it("Can't burn when forzen", async () => {
      await freezer.freeze(feeHandler.address)
      await assertRevert(feeHandler.burnMentoTokens())
    })

    it('burns contract balance', async () => {
      await stableToken.transfer(feeHandler.address, await stableToken.balanceOf(user), {
        from: user,
      })

      assertEqualBN(await feeHandler.getPastBurnForToken(stableToken.address), 0)

      const burnedAmountStable = await stableToken.balanceOf(feeHandler.address)

      await feeHandler.burn()

      assertEqualBN(await feeHandler.getPastBurnForToken(stableToken.address), burnedAmountStable)
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), 0)
      assertEqualBN(await stableToken.balanceOf(feeHandler.address), 0)
    })

    it("doesn't burn when bigger than limit", async () => {
      await feeHandler.setDailyBurnLimit(stableToken.address, new BigNumber(1000))

      await stableToken.transfer(feeHandler.address, new BigNumber(3000), {
        from: user,
      })

      await feeHandler.burn()

      assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(2000))

      // burning again shouldn't do anything
      await feeHandler.burn()
      assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(2000))
    })

    it("doesn't burn when slippage is too big", async () => {
      // TODO do the math to get the right threshold
      await feeHandler.setMaxSplippage(stableToken.address, toFixed(1 / 1e6))

      await stableToken.transfer(feeHandler.address, new BigNumber(3000), {
        from: user,
      })

      await assertRevert(feeHandler.burn())

      assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(3000))
    })

    it('reset burn limit after 24 hours', async () => {
      await feeHandler.setDailyBurnLimit(stableToken.address, new BigNumber(1000))

      await stableToken.transfer(feeHandler.address, new BigNumber(3000), {
        from: user,
      })

      await feeHandler.burn()
      await timeTravel(3600 * 24, web3)
      await feeHandler.burn()

      assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(1000))
    })

    it("doesn't burn when balance is low", async () => {
      await stableToken.transfer(feeHandler.address, new BigNumber(await feeHandler.MIN_BURN()), {
        from: user,
      })

      const balanceBefore = await stableToken.balanceOf(feeHandler.address)

      await feeHandler.burn()

      assertEqualBN(await stableToken.balanceOf(feeHandler.address), balanceBefore)
    })
  })

  describe('#burnNonMentoAssets() (if this fails with "revert" please read comments of this tests)', () => {
    // Uniswap can get the address of a pair by using an init code pair hash. Unfortunately, this hash is harcoded
    // in the file UniswapV2Library.sol. The hash writen now there is meant to run in the CI. If you're seeing this problem you can
    // 1. Skip these tests locally, as they will run in the CI anyway or
    // 2. Change the hash, you can get the hash for the parciular test deployment with the following:
    // // tslint:disable-next-line
    // console.log('Uniswap INIT CODE PAIR HASH:', await uniswapFactory.INIT_CODE_PAIR_HASH())

    beforeEach(async () => {
      await feeCurrencyWhitelist.addNonMentoToken(tokenA.address)
      await feeHandler.setRouter(tokenA.address, uniswap.address)
      await tokenA.mint(feeHandler.address, new BigNumber(10e18))
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

    it("Can't burn when frozen", async () => {
      await freezer.freeze(feeHandler.address)
      await assertRevert(feeHandler.burnNonMentoTokens())
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

      // safety check, check that the balance is not empty before the burn
      await assertGtBN(await tokenA.balanceOf(feeHandler.address), 0)
      await feeHandler.burnNonMentoTokens()

      assertEqualBN(await tokenA.balanceOf(feeHandler.address), 0)
    })

    it("Doesn't burn non Mento tokens if the limit is hit", async () => {
      assertEqualBN(await feeHandler.getPastBurnForToken(tokenA.address), 0)

      await feeHandler.setDailyBurnLimit(tokenA.address, new BigNumber(1e18))
      await feeHandler.burnNonMentoTokens()

      assertEqualBN(await feeHandler.getPastBurnForToken(tokenA.address), new BigNumber(1e18))

      assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber(9e18))
      await feeHandler.burnNonMentoTokens()
      assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber(9e18))

      await timeTravel(3600 * 24, web3)
      await feeHandler.burnNonMentoTokens()

      assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber(8e18))
    })

    it("Doesn't exchange non-Mento when slippage is too high", async () => {
      await feeHandler.setMaxSplippage(tokenA.address, maxSlippage)
      await assertRevert(feeHandler.burnNonMentoTokens())

      assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber(10e18))
    })

    it('Tries to get the best rate with many exchanges', async () => {
      await feeHandler.setRouter(tokenA.address, uniswap2.address)
      await tokenA.mint(user, new BigNumber(10e18))

      // safety check, check that the balance is no empty before the burn
      await assertGtBN(await tokenA.balanceOf(feeHandler.address), 0)

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

      await feeHandler.burnNonMentoTokens()

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

      assertEqualBN(await tokenA.balanceOf(feeHandler.address), 0) // check that it burned
    })
  })
})
