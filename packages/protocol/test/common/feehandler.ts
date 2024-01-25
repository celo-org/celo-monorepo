// TODO remove magic numbers
/* eslint:disabled ordered-imports: 0 */
// TODO either pretiffy is not fixing this or the linter is broken
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertGtBN,
  assertTransactionRevertWithReason,
  assertTransactionRevertWithoutReason,
  expectBigNumberInRange,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
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
  UniswapFeeHandlerSellerContract,
  UniswapFeeHandlerSellerInstance,
} from 'types'

import {
  ExchangeContract,
  ExchangeInstance,
  StableTokenContract,
  StableTokenEURContract,
  StableTokenEURInstance,
  StableTokenInstance,
} from 'types/mento'

import { MENTO_PACKAGE } from '@celo/protocol/contractPackages'
import { makeTruffleContractForMigration } from '@celo/protocol/lib/web3-utils'
import { SECONDS_IN_A_WEEK, ZERO_ADDRESS } from '../constants'

const goldAmountForRate = new BigNumber('1000000000000000000000000')
const stableAmountForRate = new BigNumber(2).times(goldAmountForRate)
const spread = toFixed(3 / 1000)
const reserveFraction = toFixed(5 / 100)
const maxSlippage = toFixed(1 / 100)
const initialReserveBalance = new BigNumber('10000000000000000000000')

const FeeHandler: FeeHandlerContract = artifacts.require('FeeHandler')
const Registry: RegistryContract = artifacts.require('Registry')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockReserve: MockReserveContract = artifacts.require('MockReserve')

const Freezer: FreezerContract = artifacts.require('Freezer')
const ERC20: MockERC20Contract = artifacts.require('MockERC20')

const UniswapRouter: MockUniswapV2Router02Contract = artifacts.require('MockUniswapV2Router02')
const UniswapV2Factory: MockUniswapV2FactoryContract = artifacts.require('MockUniswapV2Factory')

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')

const MentoFeeHandlerSeller: MentoFeeHandlerSellerContract =
  artifacts.require('MentoFeeHandlerSeller')

const UniswapFeeHandlerSeller: UniswapFeeHandlerSellerContract =
  artifacts.require('UniswapFeeHandlerSeller')

// Mento contracts
const Exchange: ExchangeContract = makeTruffleContractForMigration('Exchange', MENTO_PACKAGE, web3)
const StableToken: StableTokenContract = makeTruffleContractForMigration(
  'StableToken',
  MENTO_PACKAGE,
  web3
)
const StableTokenEUR: StableTokenEURContract = makeTruffleContractForMigration(
  'StableTokenEUR',
  MENTO_PACKAGE,
  web3
)

const EXAMPLE_BENEFICIARY_ADDRESS = '0x2A486910DBC72cACcbb8d0e1439C96b03B2A4699'

contract('FeeHandler', (accounts: string[]) => {
  let feeHandler: FeeHandlerInstance
  let exchange: ExchangeInstance
  let exchange2: ExchangeInstance
  let registry: RegistryInstance
  let stableToken: StableTokenInstance
  let stableToken2: StableTokenEURInstance
  let goldToken: GoldTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance
  let mockReserve: MockReserveInstance
  let freezer: FreezerInstance
  let mentoSeller: MentoFeeHandlerSellerInstance
  let uniswapFeeHandlerSeller: UniswapFeeHandlerSellerInstance
  let tokenA: MockERC20Instance

  let uniswapFactory: MockUniswapV2FactoryInstance
  let uniswapFactory2: MockUniswapV2FactoryInstance
  let uniswap: MockUniswapV2Router02Instance
  let uniswap2: MockUniswapV2Router02Instance
  let deadline

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
    goldToken = await GoldToken.new(true)
    mockReserve = await MockReserve.new()
    stableToken = await StableToken.new(true)
    stableToken2 = await StableTokenEUR.new(true)
    registry = await Registry.new(true)
    feeHandler = await FeeHandler.new(true)
    freezer = await Freezer.new(true)
    feeCurrencyWhitelist = await FeeCurrencyWhitelist.new(true)
    mentoSeller = await MentoFeeHandlerSeller.new(true)
    uniswapFeeHandlerSeller = await UniswapFeeHandlerSeller.new(true)

    tokenA = await ERC20.new()
    await feeCurrencyWhitelist.initialize()

    await registry.setAddressFor(
      CeloContractName.FeeCurrencyWhitelist,
      feeCurrencyWhitelist.address
    )
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)

    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)
    await registry.setAddressFor(CeloContractName.Reserve, mockReserve.address)
    await mockReserve.setGoldToken(goldToken.address)
    await mockReserve.addToken(stableToken.address)
    await mockReserve.addToken(stableToken2.address)

    await mentoSeller.initialize(registry.address, [], [])

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

    await stableToken2.initialize(
      'Celo Euro',
      'cEUR',
      decimals,
      registry.address,
      fixed1,
      SECONDS_IN_A_WEEK,
      [],
      [],
      CeloContractName.ExchangeEUR // USD
    )

    mockSortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)

    await mockSortedOracles.setMedianRate(stableToken.address, stableAmountForRate)
    await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
    await mockSortedOracles.setNumRates(stableToken.address, 2)
    // StableToken 2
    await mockSortedOracles.setMedianRate(stableToken2.address, stableAmountForRate)
    await mockSortedOracles.setMedianTimestampToNow(stableToken2.address)
    await mockSortedOracles.setNumRates(stableToken2.address, 2)

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

    exchange2 = await Exchange.new(true)
    await exchange2.initialize(
      registry.address,
      CeloContractName.StableTokenEUR,
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    )

    await registry.setAddressFor(CeloContractName.StableToken, stableToken.address)
    await registry.setAddressFor(CeloContractName.Exchange, exchange.address)

    await registry.setAddressFor(CeloContractName.StableTokenEUR, stableToken2.address)
    await registry.setAddressFor(CeloContractName.ExchangeEUR, exchange2.address)

    await exchange.activateStable()
    await exchange2.activateStable()

    await feeHandler.initialize(registry.address, EXAMPLE_BENEFICIARY_ADDRESS, 0, [], [], [], [])
  })

  describe('#setBurnFraction()', () => {
    it('updates burn fraction correctly', async () => {
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      assertEqualBN(await feeHandler.burnFraction(), toFixed(80 / 100))
    })

    it('only allows owner to change the burn fraction', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.setBurnFraction(toFixed(80 / 100), { from: user }),
        'Ownable: caller is not the owner.'
      )
    })

    it("doesn't allow numbers bigger than one", async () => {
      await assertTransactionRevertWithReason(
        feeHandler.setBurnFraction(toFixed(80 / 100), { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })

  describe('#setHandler()', () => {
    it('sets handler', async () => {
      await feeHandler.setHandler(stableToken.address, mentoSeller.address)
      assert(await feeHandler.getTokenHandler(stableToken.address), mentoSeller.address)
    })

    it('Only owner can set handler', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.setHandler(stableToken.address, mentoSeller.address, { from: user }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#addToken()', () => {
    it('adds it to the list', async () => {
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      assert.sameMembers(await feeHandler.getActiveTokens(), [stableToken.address])
      const handlerAddress = await feeHandler.getTokenHandler(stableToken.address)
      assert(await feeHandler.getTokenActive(stableToken.address), 'status added as active')
      assert.sameMembers(await feeHandler.getActiveTokens(), [stableToken.address])
      assert(
        handlerAddress.toLocaleLowerCase() === mentoSeller.address.toLowerCase(),
        'handler is correct'
      )
    })

    it('Only owner can add token', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.addToken(stableToken.address, mentoSeller.address, { from: user }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#removeToken()', () => {
    it('Removes form the list', async () => {
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.removeToken(stableToken.address)
      assert(
        (await feeHandler.getTokenActive(stableToken.address)) === false,
        'status is not active'
      )
      assert.sameMembers(await feeHandler.getActiveTokens(), [])
      assert((await feeHandler.getTokenHandler(stableToken.address)) === ZERO_ADDRESS)
    })

    it('Only owner can remove token', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.removeToken(stableToken.address, { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })

  describe('#deactivateToken() and activateToken()', () => {
    it('Removes form the list and adds it back', async () => {
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.deactivateToken(stableToken.address)
      assert(
        (await feeHandler.getTokenActive(stableToken.address)) === false,
        'status is not active'
      )

      assert.sameMembers(await feeHandler.getActiveTokens(), [])

      await feeHandler.activateToken(stableToken.address)
      assert((await feeHandler.getTokenActive(stableToken.address)) === true, 'status is active')

      assert.sameMembers(await feeHandler.getActiveTokens(), [stableToken.address])
    })

    it('Only owner can deactivate token', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.deactivateToken(stableToken.address, { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })

  describe('#setFeeBeneficiary()', () => {
    it('updates address correctly', async () => {
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
      assert(await feeHandler.feeBeneficiary(), EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it('only allows owner to change the burn fraction', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.setBurnFraction(EXAMPLE_BENEFICIARY_ADDRESS, { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })

  describe('#distribute()', () => {
    beforeEach(async () => {
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it("Can't distribute when not active", async () => {
      await assertTransactionRevertWithReason(
        feeHandler.distribute(stableToken.address),
        'Handler has to be set to sell token'
      )
    })

    describe('When token is active', () => {
      beforeEach(async () => {
        await feeHandler.addToken(stableToken.address, mentoSeller.address)
        await feeHandler.activateToken(stableToken.address)
      })

      it("Can't distribute when frozen", async () => {
        await freezer.freeze(feeHandler.address)
        await assertTransactionRevertWithReason(
          feeHandler.distribute(stableToken.address),
          "can't call when contract is frozen"
        )
      })

      it("doesn't distribute when balance is zero", async () => {
        assertEqualBN(await stableToken.balanceOf(feeHandler.address), 0)
        const res = await feeHandler.distribute(stableToken.address)
        assert(res.logs.length === 0, 'No transfer should be done (nor event emitted)')
      })

      describe('#distribute() with balance', () => {
        beforeEach(async () => {
          const goldTokenAmount = new BigNumber(1e18)

          await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
          await exchange.sell(goldTokenAmount, 0, true, { from: user })
          await feeHandler.setMaxSplippage(stableToken.address, toFixed(1 / 50))
          await feeHandler.addToken(stableToken.address, mentoSeller.address)
          await feeHandler.setBurnFraction(toFixed(80 / 100))
          await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
            from: user,
          })
          await feeHandler.setMaxSplippage(stableToken.address, toFixed(1))

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
    })
  })

  describe('#burnCelo()', () => {
    beforeEach(async () => {
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await goldToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })

      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.activateToken(stableToken.address)
      await feeHandler.activateToken(goldToken.address)
    })

    it('distribute correctly', async () => {
      await feeHandler.burnCelo()
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18'))
    })

    it("Doesn't burn what it's pending distribution", async () => {
      const previousBurn = await goldToken.getBurnedAmount() // status is not reset inbetween tests, so keep track of the previus burn

      await feeHandler.burnCelo()

      assertEqualBN(
        new BigNumber(await goldToken.getBurnedAmount()),
        new BigNumber('0.8e18').plus(previousBurn)
      )

      await feeHandler.burnCelo()
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18').plus(previousBurn))
    })

    it('distributes correctly after a burn', async () => {
      await feeHandler.burnCelo()
      await feeHandler.distribute(stableToken.address)
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      await feeHandler.distribute(goldToken.address)
      assertEqualBN(await goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), new BigNumber('0.2e18'))
    })
  })

  describe('#sell()', () => {
    beforeEach(async () => {
      await feeHandler.setBurnFraction(toFixed(80 / 100))
    })

    it("Can't sell when frozen", async () => {
      await freezer.freeze(feeHandler.address)
      await assertTransactionRevertWithoutReason(
        feeHandler.sell(stableToken.address),
        "can't call when contract is frozen."
      )
    })

    describe('Mento tokens', async () => {
      beforeEach(async () => {
        const goldTokenAmount = new BigNumber(1e18)

        await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
        await exchange.sell(goldTokenAmount, 0, true, { from: user })
        await feeHandler.addToken(stableToken.address, mentoSeller.address)
        await feeHandler.setMaxSplippage(stableToken.address, toFixed(1))
      })

      it("doesn't sell when balance is low", async () => {
        await stableToken.transfer(feeHandler.address, new BigNumber(await feeHandler.MIN_BURN()), {
          from: user,
        })

        const balanceBefore = await stableToken.balanceOf(feeHandler.address)

        await feeHandler.sell(stableToken.address)

        assertEqualBN(await stableToken.balanceOf(feeHandler.address), balanceBefore)
      })

      it('reset burn limit after 24 hours', async () => {
        await feeHandler.setDailySellLimit(stableToken.address, new BigNumber(1000))

        await stableToken.transfer(feeHandler.address, new BigNumber(3000), {
          from: user,
        })

        await feeHandler.sell(stableToken.address)
        await timeTravel(3600 * 24, web3)
        await feeHandler.sell(stableToken.address)

        assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(1000))
      })

      it("doesn't burn when bigger than limit", async () => {
        await feeHandler.setDailySellLimit(stableToken.address, new BigNumber(1000))

        await stableToken.transfer(feeHandler.address, new BigNumber(3000), {
          from: user,
        })

        await feeHandler.sell(stableToken.address)

        assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(2000))

        // burning again shouldn't do anything
        await feeHandler.sell(stableToken.address)
        assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber(2000))
      })

      describe('load balance', async () => {
        beforeEach(async () => {
          await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
            from: user,
          })
        })

        it('burns with mento', async () => {
          assertEqualBN(await feeHandler.getPastBurnForToken(stableToken.address), 0)
          const burnedAmountStable = await stableToken.balanceOf(feeHandler.address)
          await feeHandler.setMaxSplippage(stableToken.address, toFixed(1))
          await feeHandler.sell(stableToken.address)
          assertEqualBN(
            await feeHandler.getPastBurnForToken(stableToken.address),
            new BigNumber(burnedAmountStable).multipliedBy('0.8')
          )
          assertEqualBN(await stableToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
          assertEqualBN(
            await feeHandler.getTokenToDistribute(stableToken.address),
            new BigNumber('0.2e18')
          )

          expectBigNumberInRange(
            new BigNumber(await feeHandler.celoToBeBurned()),
            new BigNumber(
              await exchange.getBuyTokenAmount(
                new BigNumber(burnedAmountStable).multipliedBy('0.2'),
                true
              )
            ),
            new BigNumber('100000000000000000') // 0.1 Celo
          )
        })

        it("Doesn't exchange when not enough reports", async () => {
          await mentoSeller.setMinimumReports(tokenA.address, 2)
          const balanceBefore = await stableToken.balanceOf(feeHandler.address) // TODO this balance is wrong
          await feeHandler.setMaxSplippage(tokenA.address, maxSlippage)
          await assertTransactionRevertWithReason(
            feeHandler.sell(tokenA.address),
            'Handler has to be set to sell token.'
          )
          assertEqualBN(await stableToken.balanceOf(feeHandler.address), balanceBefore)
        })

        it("Doesn't burn balance if it hasn't distributed", async () => {
          await feeHandler.setMaxSplippage(stableToken.address, toFixed(1))
          await feeHandler.sell(stableToken.address)
          const balanceFefore = await stableToken.balanceOf(feeHandler.address)
          await feeHandler.sell(stableToken.address)

          assertEqualBN(balanceFefore, await stableToken.balanceOf(feeHandler.address))
        })
      })
    })

    describe('Other tokens (non-Mento)', async () => {
      beforeEach(async () => {
        deadline = (await web3.eth.getBlock('latest')).timestamp + 100
        uniswapFactory = await UniswapV2Factory.new('0x0000000000000000000000000000000000000000') // feeSetter
        // eslint-disable-next-line
        console.info('Uniswap INIT CODE PAIR HASH:', await uniswapFactory.INIT_CODE_PAIR_HASH())

        const initCodePairHash = await uniswapFactory.INIT_CODE_PAIR_HASH()

        uniswap = await UniswapRouter.new(
          uniswapFactory.address,
          '0x0000000000000000000000000000000000000000',
          initCodePairHash
        ) // _factory, _WETH

        uniswapFactory2 = await UniswapV2Factory.new('0x0000000000000000000000000000000000000000') // feeSetter

        uniswap2 = await UniswapRouter.new(
          uniswapFactory2.address,
          '0x0000000000000000000000000000000000000000',
          initCodePairHash
        ) // _factory, _WETH

        await feeCurrencyWhitelist.addToken(tokenA.address)
        await uniswapFeeHandlerSeller.initialize(registry.address, [], [])
        await uniswapFeeHandlerSeller.setRouter(tokenA.address, uniswap.address)
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

        await feeHandler.addToken(tokenA.address, uniswapFeeHandlerSeller.address)
        await feeHandler.setMaxSplippage(tokenA.address, toFixed(1))
      })

      describe('Oracle check', async () => {
        beforeEach(async () => {
          await uniswapFeeHandlerSeller.setMinimumReports(tokenA.address, 1)
          // tolerate high slippage, just to activate oracle check
          await feeHandler.setMaxSplippage(tokenA.address, toFixed(99 / 100))
          await mockSortedOracles.setMedianRate(
            tokenA.address,
            new BigNumber(1).times(goldAmountForRate)
          )
        })

        it("Doesn't exchange when not enough reports", async () => {
          await assertTransactionRevertWithReason(
            feeHandler.sell(tokenA.address),
            'Number of reports for token not enough'
          )
          assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber(10e18))
        })

        it('Works with check', async () => {
          await mockSortedOracles.setNumRates(tokenA.address, 2)
          await feeHandler.sell(tokenA.address)
          assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber('2e18'))
        })

        it('Fails when oracle slippage is high check', async () => {
          await mockSortedOracles.setNumRates(tokenA.address, 2)
          await feeHandler.setMaxSplippage(tokenA.address, toFixed(80 / 100))
          // The next tx is the one that should cause the revert, forcing a very
          await mockSortedOracles.setMedianRate(
            tokenA.address,
            new BigNumber('300').times(goldAmountForRate)
          )
          await assertTransactionRevertWithReason(
            feeHandler.sell(tokenA.address),
            'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
          )
        })
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

      it('Sells non-Mento tokens', async () => {
        // await tokenA.mint(feeHandler.address, new BigNumber(10e18))

        // safety check, check that the balance is not empty before the burn
        await assertGtBN(await tokenA.balanceOf(feeHandler.address), 0)
        await feeHandler.sell(tokenA.address)

        // Burns only burn fraction, not all
        assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber('2e18'))
      })

      it("Doesn't exchange when slippage is too high", async () => {
        await feeHandler.setMaxSplippage(tokenA.address, maxSlippage)
        await assertTransactionRevertWithReason(
          feeHandler.sell(tokenA.address),
          'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
        )
        assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber(10e18))
      })

      it('Tries to get the best rate with many exchanges', async () => {
        await uniswapFeeHandlerSeller.setRouter(tokenA.address, uniswap2.address)
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

        await feeHandler.sell(tokenA.address)

        // liquidity should have been taken of uniswap2, because it has better liquidity, and thus higher quote
        // so the quote gets worse (smaller number)

        const quote1after = (
          await uniswap.getAmountsOut(new BigNumber(1e18), [tokenA.address, goldToken.address])
        )[1]
        const quote2after = (
          await uniswap2.getAmountsOut(new BigNumber(1e18), [tokenA.address, goldToken.address])
        )[1]

        assertEqualBN(quote1before, quote1after) // uniswap 1 should be untouched
        assertGtBN(quote2before, quote2after)

        assertEqualBN(await tokenA.balanceOf(feeHandler.address), new BigNumber('2e18')) // check that it burned
      })
    })
  })

  describe('#handle() (Mento tokens only)', () => {
    beforeEach(async () => {
      await goldToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it('should revert when token not added', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.handle(stableToken.address),
        'Handler has to be set to sell token'
      )
    })

    describe('When token active', () => {
      beforeEach(async () => {
        await feeHandler.activateToken(goldToken.address)
      })

      it('handles Celo', async () => {
        const pastBurn = await goldToken.getBurnedAmount()
        const previusBeneficiaryBalance = await goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS)
        // basically it just does a burn
        await feeHandler.handle(goldToken.address)
        assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18').plus(pastBurn))
        assertEqualBN(
          await goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS),
          new BigNumber('0.2e18').plus(previusBeneficiaryBalance)
        )
      })
    })
  })

  describe('#handleAll()', () => {
    beforeEach(async () => {
      const goldTokenAmount = new BigNumber(1e18)

      await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      await goldToken.approve(exchange2.address, goldTokenAmount, { from: user })

      await exchange.sell(goldTokenAmount, 0, true, { from: user })
      await exchange2.sell(goldTokenAmount, 0, true, { from: user })

      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.addToken(stableToken2.address, mentoSeller.address)
      await feeHandler.setMaxSplippage(stableToken.address, toFixed(1))
      await feeHandler.setMaxSplippage(stableToken2.address, toFixed(1))

      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it('burns with mento', async () => {
      const previousBurn = await goldToken.getBurnedAmount()
      await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })
      await stableToken2.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })

      assertEqualBN(await feeHandler.getPastBurnForToken(stableToken.address), 0)
      const burnedAmountStable = await stableToken.balanceOf(feeHandler.address)

      await feeHandler.handleAll()

      assertEqualBN(
        await feeHandler.getPastBurnForToken(stableToken.address),
        new BigNumber(burnedAmountStable).multipliedBy('0.8')
      )
      assertEqualBN(
        await feeHandler.getPastBurnForToken(stableToken2.address),
        new BigNumber(burnedAmountStable).multipliedBy('0.8')
      )
      assertEqualBN(
        await stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS),
        new BigNumber('0.2e18')
      )
      assertEqualBN(
        await stableToken2.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS),
        new BigNumber('0.2e18')
      )
      // everything should have been burned

      assertEqualBN(await feeHandler.getTokenToDistribute(stableToken.address), 0)
      assertEqualBN(await feeHandler.getTokenToDistribute(stableToken2.address), 0)

      // burn is non zero
      assertGtBN(await goldToken.getBurnedAmount(), previousBurn)
    })
  })

  describe('#transfer()', () => {
    beforeEach(async () => {
      await tokenA.mint(feeHandler.address, new BigNumber(1e18))
    })

    it('Only owner can take tokens out', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.transfer(tokenA.address, user, new BigNumber(1e18), { from: user }),
        'Ownable: caller is not the owner.'
      )
    })

    it('Can take funds out', async () => {
      await feeHandler.transfer(tokenA.address, user, new BigNumber(1e18))
      assertEqualBN(await tokenA.balanceOf(user), new BigNumber(1e18))
    })
  })

  describe('#setDailySellLimit()', () => {
    it('should only be called by owner', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.setDailySellLimit(stableToken.address, goldAmountForRate, { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })

  describe('#setMaxSplipagge()', () => {
    it('should only be called by owner', async () => {
      await assertTransactionRevertWithReason(
        feeHandler.setMaxSplippage(stableToken.address, maxSlippage, { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })
})
