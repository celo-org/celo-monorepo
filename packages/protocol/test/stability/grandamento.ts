import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { fromFixed, reciprocal, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import {
  GoldTokenContract,
  GoldTokenInstance,
  GrandaMentoContract,
  GrandaMentoInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const GrandaMento: GrandaMentoContract = artifacts.require('GrandaMento')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
GoldToken.numberFormat = 'BigNumber'
// @ts-ignore
GrandaMento.numberFormat = 'BigNumber'
// @ts-ignore
MockSortedOracles.numberFormat = 'BigNumber'
// @ts-ignore
MockStableToken.numberFormat = 'BigNumber'
// @ts-ignore
Registry.numberFormat = 'BigNumber'

enum ExchangeState {
  None,
  Proposed,
  Approved,
  Executed,
  Cancelled,
}

function parseExchangeProposal(
  proposalRaw: [string, string, BigNumber, BigNumber, BigNumber, BigNumber, any]
) {
  return {
    exchanger: proposalRaw[0],
    stableToken: proposalRaw[1],
    sellAmount: proposalRaw[2],
    buyAmount: proposalRaw[3],
    approvalTimestamp: proposalRaw[4],
    state: proposalRaw[5].toNumber() as ExchangeState,
    sellCelo: typeof proposalRaw[6] === 'boolean' ? proposalRaw[6] : proposalRaw[6] === 'true',
  }
}

function parseExchangeLimits(exchangeLimitsRaw: [BigNumber, BigNumber]) {
  return {
    minExchangeAmount: exchangeLimitsRaw[0],
    maxExchangeAmount: exchangeLimitsRaw[1],
  }
}

contract('GrandaMento', (accounts: string[]) => {
  let goldToken: GoldTokenInstance
  let grandaMento: GrandaMentoInstance
  let sortedOracles: MockSortedOraclesInstance
  let stableToken: MockStableTokenInstance
  let registry: RegistryInstance

  const owner = accounts[0]

  const decimals = 18
  const unit = new BigNumber(10).pow(decimals)
  // CELO quoted in StableToken (cUSD), ie $5
  const defaultCeloStableTokenRate = toFixed(5)

  const spread = 0.01 // 1%
  const spreadFixed = toFixed(spread)

  const stableTokenInflationFactor = 1

  // 2000 StableTokens
  const ownerStableTokenBalance = unit.times(2000)

  const minExchangeAmount = unit.times(100)
  const maxExchangeAmount = unit.times(1000)

  beforeEach(async () => {
    registry = await Registry.new()

    goldToken = await GoldToken.new(true)
    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)

    stableToken = await MockStableToken.new()
    await stableToken.mint(owner, ownerStableTokenBalance)
    await stableToken.setInflationFactor(toFixed(stableTokenInflationFactor))
    await registry.setAddressFor(CeloContractName.StableToken, stableToken.address)

    sortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, sortedOracles.address)
    await sortedOracles.setMedianRate(stableToken.address, defaultCeloStableTokenRate)
    await sortedOracles.setMedianTimestampToNow(stableToken.address)
    await sortedOracles.setNumRates(stableToken.address, 2)

    grandaMento = await GrandaMento.new(true)
    await grandaMento.initialize(registry.address, spreadFixed)
    await grandaMento.setStableTokenExchangeLimits(
      stableToken.address,
      minExchangeAmount,
      maxExchangeAmount
    )
  })

  describe('#initialize()', () => {
    it('sets the owner', async () => {
      assert.equal(await grandaMento.owner(), owner)
    })

    it('sets the registry', async () => {
      assert.equal(await grandaMento.registry(), registry.address)
    })

    it('sets the spread', async () => {
      assertEqualBN(await grandaMento.spread(), spreadFixed)
    })

    it('reverts when called again', async () => {
      await assertRevert(
        grandaMento.initialize(registry.address, spreadFixed),
        'contract already initialized'
      )
    })
  })

  describe('#createExchangeProposal', () => {
    it('returns the proposal ID', async () => {
      const stableTokenSellAmount = unit.times(500)
      const id = await grandaMento.createExchangeProposal.call(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(id, 0)
    })

    it('increments the exchange proposal count', async () => {
      assertEqualBN(await grandaMento.exchangeProposalCount(), 0)
      const stableTokenSellAmount = unit.times(500)
      await grandaMento.createExchangeProposal(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(await grandaMento.exchangeProposalCount(), 1)
    })

    it('assigns proposal IDs based off the exchange proposal count', async () => {
      const stableTokenSellAmount = unit.times(200)
      const receipt0 = await grandaMento.createExchangeProposal(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(receipt0.logs[0].args.proposalId, 0)

      const receipt1 = await grandaMento.createExchangeProposal(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(receipt1.logs[0].args.proposalId, 1)
    })

    describe('when proposing an exchange that sells stable tokens', () => {
      // Celo token price quoted in CELO
      const stableTokenCeloRate = reciprocal(defaultCeloStableTokenRate)
      const stableTokenSellAmount = unit.times(500)
      it('emits the ExchangeProposalCreated event with the sell amount as the stable token value when its inflation factor is 1', async () => {
        const receipt = await grandaMento.createExchangeProposal(
          stableToken.address,
          stableTokenSellAmount,
          false // sellCelo = false as we are selling stableToken
        )
        assertLogMatches2(receipt.logs[0], {
          event: 'ExchangeProposalCreated',
          args: {
            exchanger: owner,
            proposalId: 0,
            stableToken: stableToken.address,
            sellAmount: stableTokenSellAmount,
            buyAmount: getBuyAmount(stableTokenSellAmount, fromFixed(stableTokenCeloRate), spread),
            sellCelo: false,
          },
        })
      })

      it('emits the ExchangeProposalCreated event with the sell amount as the stable token value when its inflation factor not 1', async () => {
        // Set the inflationFactor to something that isn't 1
        const inflationFactor = 1.05
        await stableToken.setInflationFactor(toFixed(inflationFactor))

        const receipt = await grandaMento.createExchangeProposal(
          stableToken.address,
          stableTokenSellAmount,
          false // sellCelo = false as we are selling stableToken
        )
        assertLogMatches2(receipt.logs[0], {
          event: 'ExchangeProposalCreated',
          args: {
            exchanger: owner,
            proposalId: 0,
            stableToken: stableToken.address,
            sellAmount: stableTokenSellAmount,
            buyAmount: getBuyAmount(stableTokenSellAmount, fromFixed(stableTokenCeloRate), spread),
            sellCelo: false,
          },
        })
      })

      it('stores the exchange proposal with the sell amount in units when the stable token inflation factor is 1', async () => {
        await grandaMento.createExchangeProposal(
          stableToken.address,
          stableTokenSellAmount,
          false // sellCelo = false as we are selling stableToken
        )
        // 0 is the proposal ID
        const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(0))
        assert.equal(exchangeProposal.exchanger, owner)
        assert.equal(exchangeProposal.stableToken, stableToken.address)
        assertEqualBN(
          exchangeProposal.sellAmount,
          valueToUnits(stableTokenSellAmount, stableTokenInflationFactor)
        )
        assertEqualBN(
          exchangeProposal.buyAmount,
          getBuyAmount(stableTokenSellAmount, fromFixed(stableTokenCeloRate), spread)
        )
        assertEqualBN(exchangeProposal.approvalTimestamp, 0)
        assert.equal(exchangeProposal.state, ExchangeState.Proposed)
        assert.equal(exchangeProposal.sellCelo, false)
      })

      it('stores the exchange proposal with the sell amount in units when the stable token inflation factor is not 1', async () => {
        // Set the inflationFactor to something that isn't 1
        const inflationFactor = 1.05
        await stableToken.setInflationFactor(toFixed(inflationFactor))

        await grandaMento.createExchangeProposal(
          stableToken.address,
          stableTokenSellAmount,
          false // sellCelo = false as we are selling stableToken
        )
        // 0 is the proposal ID
        const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(0))
        assert.equal(exchangeProposal.exchanger, owner)
        assert.equal(exchangeProposal.stableToken, stableToken.address)
        assertEqualBN(
          exchangeProposal.sellAmount,
          valueToUnits(stableTokenSellAmount, inflationFactor)
        )
        assertEqualBN(
          exchangeProposal.buyAmount,
          getBuyAmount(stableTokenSellAmount, fromFixed(stableTokenCeloRate), spread)
        )
        assertEqualBN(exchangeProposal.approvalTimestamp, 0)
        assert.equal(exchangeProposal.state, ExchangeState.Proposed)
        assert.equal(exchangeProposal.sellCelo, false)
      })

      it('deposits the stable tokens to be sold', async () => {
        const senderBalanceBefore = await stableToken.balanceOf(owner)
        const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
        await grandaMento.createExchangeProposal(
          stableToken.address,
          stableTokenSellAmount,
          false // sellCelo = false as we are selling stableToken
        )
        const senderBalanceAfter = await stableToken.balanceOf(owner)
        const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
        // Sender paid
        assertEqualBN(senderBalanceBefore.minus(senderBalanceAfter), stableTokenSellAmount)
        // GrandaMento received
        assertEqualBN(
          grandaMentoBalanceAfter.minus(grandaMentoBalanceBefore),
          stableTokenSellAmount
        )
      })

      it('reverts if the amount being sold is less than the stable token min exchange amount', async () => {
        await assertRevert(
          grandaMento.createExchangeProposal(
            stableToken.address,
            minExchangeAmount.minus(1),
            false // sellCelo = false as we are selling stableToken
          ),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the amount being sold is greater than the stable token max exchange amount', async () => {
        await assertRevert(
          grandaMento.createExchangeProposal(
            stableToken.address,
            maxExchangeAmount.plus(1),
            false // sellCelo = false as we are selling stableToken
          ),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the stable token has not had exchange limits set', async () => {
        const newStableToken = await MockStableToken.new()
        await newStableToken.mint(owner, ownerStableTokenBalance)
        await assertRevert(
          grandaMento.createExchangeProposal(
            newStableToken.address,
            stableTokenSellAmount,
            false // sellCelo = false as we are selling stableToken
          ),
          'Max stable token exchange amount must be > 0'
        )
      })
    })

    describe('when proposing an exchange that sells CELO', () => {
      const createExchangeProposal = async (_stableToken: string, sellAmount: BigNumber) => {
        await goldToken.approve(grandaMento.address, sellAmount)
        // sellCelo = true as we are selling CELO
        return grandaMento.createExchangeProposal(_stableToken, sellAmount, true)
      }
      const celoSellAmount = unit.times(100)
      it('emits the ExchangeProposalCreated event', async () => {
        const receipt = await createExchangeProposal(stableToken.address, celoSellAmount)
        assertLogMatches2(receipt.logs[0], {
          event: 'ExchangeProposalCreated',
          args: {
            exchanger: owner,
            proposalId: 0,
            stableToken: stableToken.address,
            sellAmount: celoSellAmount,
            buyAmount: getBuyAmount(celoSellAmount, fromFixed(defaultCeloStableTokenRate), spread),
            sellCelo: true,
          },
        })
      })

      it('stores the exchange proposal', async () => {
        await createExchangeProposal(stableToken.address, celoSellAmount)
        // 0 is the proposal ID
        const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(0))
        assert.equal(exchangeProposal.exchanger, owner)
        assert.equal(exchangeProposal.stableToken, stableToken.address)
        assertEqualBN(exchangeProposal.sellAmount, celoSellAmount)
        assertEqualBN(
          exchangeProposal.buyAmount,
          getBuyAmount(celoSellAmount, fromFixed(defaultCeloStableTokenRate), spread)
        )
        assertEqualBN(exchangeProposal.approvalTimestamp, 0)
        assert.equal(exchangeProposal.state, ExchangeState.Proposed)
        assert.equal(exchangeProposal.sellCelo, true)
      })

      it('deposits the stable tokens to be sold', async () => {
        const senderBalanceBefore = await goldToken.balanceOf(owner)
        const grandaMentoBalanceBefore = await goldToken.balanceOf(grandaMento.address)
        await createExchangeProposal(stableToken.address, celoSellAmount)
        const senderBalanceAfter = await goldToken.balanceOf(owner)
        const grandaMentoBalanceAfter = await goldToken.balanceOf(grandaMento.address)
        // Sender paid
        assertEqualBN(senderBalanceBefore.minus(senderBalanceAfter), celoSellAmount)
        // GrandaMento received
        assertEqualBN(grandaMentoBalanceAfter.minus(grandaMentoBalanceBefore), celoSellAmount)
      })

      it('reverts if the amount being sold is less than the stable token min exchange amount', async () => {
        const sellAmount = getSellAmount(
          minExchangeAmount,
          fromFixed(defaultCeloStableTokenRate),
          spread
        ).minus(1)
        await assertRevert(
          grandaMento.createExchangeProposal(
            stableToken.address,
            sellAmount,
            true // sellCelo = true as we are selling CELO
          ),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the amount being sold is greater than the stable token max exchange amount', async () => {
        const sellAmount = getSellAmount(
          maxExchangeAmount,
          fromFixed(defaultCeloStableTokenRate),
          spread
        ).plus(1)
        await assertRevert(
          createExchangeProposal(stableToken.address, sellAmount),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the stable token has not had exchange limits set', async () => {
        const newStableToken = await MockStableToken.new()
        await newStableToken.mint(owner, ownerStableTokenBalance)
        await assertRevert(
          createExchangeProposal(newStableToken.address, celoSellAmount),
          'Max stable token exchange amount must be > 0'
        )
      })
    })
  })

  describe('#getBuyAmount', () => {
    const sellAmount = unit.times(500)
    describe('when selling stable token', () => {
      // Price of stableToken quoted in CELO
      const stableTokenCeloRate = fromFixed(reciprocal(defaultCeloStableTokenRate))
      it('returns the amount being bought when the spread is 0', async () => {
        // Set spread as 0%
        await grandaMento.setSpread(0)
        assertEqualBN(
          await grandaMento.getBuyAmount(
            stableToken.address,
            sellAmount,
            false // sellCelo = false as we are selling stableToken
          ),
          getBuyAmount(sellAmount, stableTokenCeloRate, 0)
        )
      })

      it('returns the amount being bought when the spread is > 0', async () => {
        // Set spread as 1%
        const _spread = 0.01
        await grandaMento.setSpread(toFixed(_spread))

        assertEqualBN(
          await grandaMento.getBuyAmount(
            stableToken.address,
            sellAmount,
            false // sellCelo = false as we are selling stableToken
          ),
          getBuyAmount(sellAmount, stableTokenCeloRate, _spread)
        )
      })
    })

    describe('when selling CELO', () => {
      // Price of CELO quoted in stable tokens
      const celoStableTokenRate = fromFixed(defaultCeloStableTokenRate)
      it('returns the amount being bought when the spread is 0', async () => {
        // Set spread as 0%
        await grandaMento.setSpread(0)
        assertEqualBN(
          await grandaMento.getBuyAmount(
            stableToken.address,
            sellAmount,
            true // sellCelo = true as we are selling CELO
          ),
          getBuyAmount(sellAmount, celoStableTokenRate, 0)
        )
      })

      it('returns the amount being bought when the spread is > 0', async () => {
        // Set spread as 1%
        const _spread = 0.01
        await grandaMento.setSpread(toFixed(_spread))

        assertEqualBN(
          await grandaMento.getBuyAmount(
            stableToken.address,
            sellAmount,
            true // sellCelo = true as we are selling CELO
          ),
          getBuyAmount(sellAmount, celoStableTokenRate, _spread)
        )
      })
    })

    it('reverts when there is no oracle price for the stable token', async () => {
      const newStableToken = await MockStableToken.new()
      await assertRevert(
        grandaMento.getBuyAmount(newStableToken.address, sellAmount, true),
        'No oracle rates present for token'
      )
    })
  })

  describe('#setSpread', () => {
    // 0.5%
    const newSpreadFixed = toFixed(0.005)
    it('sets the spread', async () => {
      await grandaMento.setSpread(newSpreadFixed)
      assertEqualBN(await grandaMento.spread(), newSpreadFixed)
    })

    it('emits the SpreadSet event', async () => {
      const receipt = await grandaMento.setSpread(newSpreadFixed)
      assertLogMatches2(receipt.logs[0], {
        event: 'SpreadSet',
        args: {
          spread: newSpreadFixed,
        },
      })
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevert(
        grandaMento.setSpread(newSpreadFixed, { from: accounts[1] }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#setStableTokenExchangeLimits', () => {
    const min = unit.times(123)
    const max = unit.times(321)
    it('sets the exchange limits for the provided stable token', async () => {
      await grandaMento.setStableTokenExchangeLimits(stableToken.address, min, max)
      const exchangeLimits = parseExchangeLimits(
        await grandaMento.stableTokenExchangeLimits(stableToken.address)
      )
      assertEqualBN(exchangeLimits.minExchangeAmount, min)
      assertEqualBN(exchangeLimits.maxExchangeAmount, max)
    })

    it('emits the StableTokenExchangeLimitsSet event', async () => {
      const receipt = await grandaMento.setStableTokenExchangeLimits(stableToken.address, min, max)
      assertLogMatches2(receipt.logs[0], {
        event: 'StableTokenExchangeLimitsSet',
        args: {
          stableToken: stableToken.address,
          minExchangeAmount: min,
          maxExchangeAmount: max,
        },
      })
    })

    it('reverts when the minExchangeAmount is greater than the maxExchangeAmount', async () => {
      await assertRevert(
        grandaMento.setStableTokenExchangeLimits(stableToken.address, max, min, {
          from: accounts[1],
        }),
        'Min exchange amount must not be greater than max'
      )
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevert(
        grandaMento.setStableTokenExchangeLimits(stableToken.address, min, max, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      )
    })
  })
})

// exchangeRate is the price of the sell token quoted in buy token
function getBuyAmount(sellAmount: BigNumber, exchangeRate: BigNumber, spread: BigNumber.Value) {
  return sellAmount.times(new BigNumber(1).minus(spread)).times(exchangeRate)
}

// exchangeRate is the price of the sell token quoted in buy token
function getSellAmount(buyAmount: BigNumber, exchangeRate: BigNumber, spread: BigNumber.Value) {
  return buyAmount.idiv(exchangeRate.times(new BigNumber(1).minus(spread)))
}

function valueToUnits(value: BigNumber, inflationFactor: BigNumber.Value) {
  return value.times(inflationFactor)
}
