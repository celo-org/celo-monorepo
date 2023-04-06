// /* tslint:disable */

// TODO remove magic numbers
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertGtBN, assertRevert } from '@celo/protocol/lib/test-utils'
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
  RegistryContract,
  RegistryInstance,
  StableTokenContract,
  StableTokenEURContract,
  StableTokenEURInstance,
  StableTokenInstance,
  UniswapFeeHandlerSellerContract,
  UniswapFeeHandlerSellerInstance,
} from 'types'
import { SECONDS_IN_A_WEEK } from '../constants'

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
const StableTokenEUR: StableTokenEURContract = artifacts.require('StableTokenEUR')
const Freezer: FreezerContract = artifacts.require('Freezer')
const ERC20: MockERC20Contract = artifacts.require('MockERC20')

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')

const MentoFeeHandlerSeller: MentoFeeHandlerSellerContract = artifacts.require(
  'MentoFeeHandlerSeller'
)

const UniswapFeeHandlerSeller: UniswapFeeHandlerSellerContract = artifacts.require(
  'UniswapFeeHandlerSeller'
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

    await feeHandler.initialize(registry.address, EXAMPLE_BENEFICIARY_ADDRESS, [], [], [], [])
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

  describe('#addToken()', () => {
    it('adds it to the list', async () => {
      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      assert.sameMembers(await feeHandler.getActiveTokens(), [stableToken.address])
      const handlerAddress = await feeHandler.getTokenHandler(stableToken.address)
      assert(await feeHandler.getTokenActive(stableToken.address), 'status added as active')
      assert(
        handlerAddress.toLocaleLowerCase() === mentoSeller.address.toLowerCase(),
        'handler is correct'
      )
    })

    it('Only owner can add token', async () => {
      await assertRevert(
        feeHandler.addToken(stableToken.address, mentoSeller.address, { from: user })
      )
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

  describe('#burnCelo()', () => {
    beforeEach(async () => {
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await goldToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })

      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
    })

    it('distribute correctly', async () => {
      await feeHandler.burnCelo()
      assertEqualBN(await goldToken.balanceOf(feeHandler.address), new BigNumber('0.2e18'))
      assertEqualBN(await goldToken.getBurnedAmount(), new BigNumber('0.8e18'))
    })

    it("Doesn't burn what it's pending distributio", async () => {
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

    it('distributes correcly after a burn', async () => {
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

    describe('Mento tokens', async () => {
      beforeEach(async () => {
        const goldTokenAmount = new BigNumber(1e18)

        await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
        await exchange.sell(goldTokenAmount, 0, true, { from: user })
        await feeHandler.addToken(stableToken.address, mentoSeller.address)
      })

      it('burns with mento', async () => {
        await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
          from: user,
        })
        assertEqualBN(await feeHandler.getPastBurnForToken(stableToken.address), 0)
        const burnedAmountStable = await stableToken.balanceOf(feeHandler.address)
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
      })

      it("Doesn't burn balance if it hasn't distributed", async () => {
        await stableToken.transfer(feeHandler.address, new BigNumber('1e18'), {
          from: user,
        })
        await feeHandler.sell(stableToken.address)
        const balanceFefore = await stableToken.balanceOf(feeHandler.address)
        await feeHandler.sell(stableToken.address)

        assertEqualBN(balanceFefore, await stableToken.balanceOf(feeHandler.address))
      })
    })

    describe('Other tokens (non-Mento)', async () => {
      beforeEach(async () => {
        await feeHandler.addToken(tokenA.address, uniswapFeeHandlerSeller.address)
      })

      it('sells nonMento tokens', async () => {
        // TODO complete when able to burn nonMento tokens
      })
    })
  })

  describe('#handle()', () => {
    beforeEach(async () => {
      await goldToken.transfer(feeHandler.address, new BigNumber('1e18'), {
        from: user,
      })
      await feeHandler.setBurnFraction(toFixed(80 / 100))
      await feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS)
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

  describe('#handleAll()', () => {
    beforeEach(async () => {
      const goldTokenAmount = new BigNumber(1e18)

      await goldToken.approve(exchange.address, goldTokenAmount, { from: user })
      await goldToken.approve(exchange2.address, goldTokenAmount, { from: user })

      await exchange.sell(goldTokenAmount, 0, true, { from: user })
      await exchange2.sell(goldTokenAmount, 0, true, { from: user })

      await feeHandler.addToken(stableToken.address, mentoSeller.address)
      await feeHandler.addToken(stableToken2.address, mentoSeller.address)

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
      await assertRevert(
        feeHandler.transfer(tokenA.address, user, new BigNumber(1e18), { from: user })
      )
    })

    it('Can take funds out', async () => {
      await feeHandler.transfer(tokenA.address, user, new BigNumber(1e18))
      assertEqualBN(await tokenA.balanceOf(user), new BigNumber(1e18))
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
})
