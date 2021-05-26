import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { divide, fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import {
  GrandaMentoContract,
  GrandaMentoInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const GrandaMento: GrandaMentoContract = artifacts.require('GrandaMento')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
GrandaMento.numberFormat = 'BigNumber'
// @ts-ignore
MockSortedOracles.numberFormat = 'BigNumber'
// @ts-ignore
MockStableToken.numberFormat = 'BigNumber'
// @ts-ignore
Registry.numberFormat = 'BigNumber'

enum ExchangeState {
  Empty,
  Proposed,
  Approved,
  Executed,
  Cancelled,
}

const parseExchangeProposal = (
  proposalRaw: [string, string, BigNumber, BigNumber, BigNumber, any]
) => {
  return {
    exchanger: proposalRaw[0],
    stableToken: proposalRaw[1],
    sellAmount: proposalRaw[2],
    buyAmount: proposalRaw[3],
    state: proposalRaw[4].toNumber() as ExchangeState,
    sellCelo: typeof proposalRaw[5] == 'boolean' ? proposalRaw[5] : proposalRaw[5] == 'true',
  }
}

contract('GrandaMento', (accounts: string[]) => {
  let grandaMento: GrandaMentoInstance
  let sortedOracles: MockSortedOraclesInstance
  let stableToken: MockStableTokenInstance
  let registry: RegistryInstance

  const owner = accounts[0]

  const decimals = 18
  const unit = new BigNumber(10).pow(decimals)
  // CELO quoted in StableToken (cUSD), ie $5
  const defaultCeloStableTokenRate = toFixed(5)

  const spread = toFixed(0.01) // 1%

  beforeEach(async () => {
    registry = await Registry.new()

    stableToken = await MockStableToken.new()
    await registry.setAddressFor(CeloContractName.StableToken, stableToken.address)

    sortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, sortedOracles.address)
    await sortedOracles.setMedianRate(stableToken.address, defaultCeloStableTokenRate)
    await sortedOracles.setMedianTimestampToNow(stableToken.address)
    await sortedOracles.setNumRates(stableToken.address, 2)

    grandaMento = await GrandaMento.new(true)
    await grandaMento.initialize(registry.address, spread)
    await grandaMento.setStableTokenExchangeLimits(
      stableToken.address,
      unit.times(100),
      unit.times(1000)
    )

    console.log('grandaMento address', grandaMento.address)
    console.log('registry address', registry.address)
    console.log('sortedOracles address', sortedOracles.address)
    console.log('stableToken address', stableToken.address)
  })

  describe('#initialize()', () => {
    it('sets the owner', async () => {
      assert.equal(await grandaMento.owner(), owner)
    })

    it('sets the registry', async () => {
      assert.equal(await grandaMento.registry(), registry.address)
    })

    it('sets the spread', async () => {
      assert.equal(await grandaMento.spread(), spread)
    })

    it('reverts when called again', async () => {
      await assertRevert(grandaMento.initialize(registry.address, spread))
    })
  })

  describe('#proposeExchange', () => {
    // 1000 StableTokens
    const ownerStableTokenBalance = unit.times(1000)

    beforeEach(async () => {
      await stableToken.mint(owner, ownerStableTokenBalance)
    })

    it('returns the proposal ID', async () => {
      const stableTokenSellAmount = unit.times(500)
      const id = await grandaMento.proposeExchange.call(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(id, 0)
    })

    it('increments the exchange proposal count', async () => {
      assertEqualBN(await grandaMento.exchangeProposalCount(), 0)
      const stableTokenSellAmount = unit.times(500)
      await grandaMento.proposeExchange(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(await grandaMento.exchangeProposalCount(), 1)
    })

    it('assigns proposal IDs based off the exchange proposal count', async () => {
      const stableTokenSellAmount = unit.times(200)
      const receipt0 = await grandaMento.proposeExchange(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(receipt0.logs[0].args.proposalId, 0)

      const receipt1 = await grandaMento.proposeExchange(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(receipt1.logs[0].args.proposalId, 1)
    })

    it('stores the exchange proposal', async () => {
      const stableTokenSellAmount = unit.times(500)
      await grandaMento.proposeExchange(
        stableToken.address,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      // 0 is the proposal ID
      const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(0))
      assert.equal(exchangeProposal.exchanger, owner)
      assert.equal(exchangeProposal.stableToken, stableToken.address)
      assertEqualBN(exchangeProposal.sellAmount, stableTokenSellAmount)
      assertEqualBN(
        exchangeProposal.buyAmount,
        divide(stableTokenSellAmount, defaultCeloStableTokenRate)
      )
      assert.equal(exchangeProposal.state, ExchangeState.Proposed)
      assert.equal(exchangeProposal.sellCelo, false)
    })

    describe('when proposing an exchange when selling a stable token', () => {
      it('emits the ProposedExchange event', async () => {
        const stableTokenSellAmount = unit.times(500)
        const receipt = await grandaMento.proposeExchange(
          stableToken.address,
          stableTokenSellAmount,
          false // sellCelo = false as we are selling stableToken
        )
        assertLogMatches2(receipt.logs[0], {
          event: 'ProposedExchange',
          args: {
            exchanger: owner,
            proposalId: 0,
            stableToken: stableToken.address,
            sellAmount: stableTokenSellAmount,
            buyAmount: stableTokenSellAmount.div(fromFixed(defaultCeloStableTokenRate)),
            sellCelo: false,
          },
        })
      })
    })

    describe('#getBuyAmount', () => {
      describe('when selling stable token', () => {
        it('returns the amount being bought when the spread is 0', async () => {
          // Set spread as 0%
          await grandaMento.setSpread(0)
          const stableTokenSellAmount = unit.times(500)
          assertEqualBN(
            await grandaMento.getBuyAmount(
              stableToken.address,
              stableTokenSellAmount,
              false // sellCelo = false as we are selling stableToken
            ),
            stableTokenSellAmount.div(fromFixed(defaultCeloStableTokenRate))
          )
        })

        it('returns the amount being bought when the spread is > 0', async () => {
          // Set spread as 1%
          const spread = 0.01
          await grandaMento.setSpread(toFixed(spread))

          const stableTokenSellAmount = unit.times(500)
          assertEqualBN(
            await grandaMento.getBuyAmount(
              stableToken.address,
              stableTokenSellAmount,
              false // sellCelo = false as we are selling stableToken
            ),
            stableTokenSellAmount.times(0.99).div(fromFixed(defaultCeloStableTokenRate))
          )
        })
      })
    })
  })

  describe('#setSpread', () => {
    it('sets the spread', async () => {
      // Ensure initial value is 0
      assertEqualBN(await grandaMento.spread(), 0)
    })
  })
})
