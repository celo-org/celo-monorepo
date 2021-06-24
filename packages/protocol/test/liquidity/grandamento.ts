import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertEqualBNArray,
  assertLogMatches2,
  assertRevertWithReason,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { fromFixed, reciprocal, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import {
  GoldTokenContract,
  GoldTokenInstance,
  GrandaMentoContract,
  GrandaMentoInstance,
  MockGoldTokenContract,
  MockReserveContract,
  MockReserveInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const GrandaMento: GrandaMentoContract = artifacts.require('GrandaMento')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const Registry: RegistryContract = artifacts.require('Registry')
const MockReserve: MockReserveContract = artifacts.require('MockReserve')

// @ts-ignore
GoldToken.numberFormat = 'BigNumber'
// @ts-ignore
GrandaMento.numberFormat = 'BigNumber'
// @ts-ignore
MockGoldToken.numberFormat = 'BigNumber'
// @ts-ignore
MockReserve.numberFormat = 'BigNumber'
// @ts-ignore
MockSortedOracles.numberFormat = 'BigNumber'
// @ts-ignore
MockStableToken.numberFormat = 'BigNumber'
// @ts-ignore
Registry.numberFormat = 'BigNumber'

enum ExchangeProposalState {
  None,
  Proposed,
  Approved,
  Executed,
  Cancelled,
}

function parseExchangeProposal(
  proposalRaw: [string, string, BigNumber, any, BigNumber, BigNumber, BigNumber]
) {
  return {
    exchanger: proposalRaw[0],
    stableToken: proposalRaw[1],
    state: proposalRaw[2].toNumber() as ExchangeProposalState,
    sellCelo: typeof proposalRaw[3] === 'boolean' ? proposalRaw[3] : proposalRaw[3] === 'true',
    sellAmount: proposalRaw[4],
    buyAmount: proposalRaw[5],
    approvalTimestamp: proposalRaw[6],
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
  let reserve: MockReserveInstance

  const [owner, approver, alice] = accounts

  const decimals = 18
  const unit = new BigNumber(10).pow(decimals)
  // CELO quoted in StableToken (cUSD), ie $5
  const defaultCeloStableTokenRate = toFixed(5)
  // StableToken quoted in CELO, ie 1 / $5 = $0.2
  const defaultStableTokenCeloRate = reciprocal(defaultCeloStableTokenRate)

  const spread = 0.01 // 1%
  const spreadFixed = toFixed(spread)

  const vetoPeriodSeconds = 60 * 60 * 3 // 3 hours

  const stableTokenInflationFactor = 1

  const minExchangeAmount = unit.times(100)
  const maxExchangeAmount = unit.times(1000)

  const stableTokenSellAmount = unit.times(500)
  const celoSellAmount = unit.times(100)

  const stableTokenRegistryId = CeloContractName.StableToken

  const createExchangeProposal = async (
    sellCelo: boolean,
    from: string = owner,
    _stableTokenRegistryId?: CeloContractName
  ) => {
    // When a test sets sellCelo to true, the sender in the test must approve
    // the CELO to grandaMento.
    // The MockStableToken does not enforce allowances so there is no need
    // to approve the stable token to grandaMento when sellCelo is false.
    if (sellCelo) {
      await goldToken.approve(grandaMento.address, celoSellAmount, { from })
    }
    return grandaMento.createExchangeProposal(
      _stableTokenRegistryId || stableTokenRegistryId,
      sellCelo ? celoSellAmount : stableTokenSellAmount,
      sellCelo,
      { from }
    )
  }

  beforeEach(async () => {
    registry = await Registry.new()

    goldToken = await GoldToken.new(true)
    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)

    stableToken = await MockStableToken.new()
    const balance = unit.times(2000)
    await stableToken.mint(owner, balance)
    await stableToken.mint(alice, balance)
    await stableToken.setInflationFactor(toFixed(stableTokenInflationFactor))
    await registry.setAddressFor(stableTokenRegistryId, stableToken.address)

    sortedOracles = await MockSortedOracles.new()
    await registry.setAddressFor(CeloContractName.SortedOracles, sortedOracles.address)
    await sortedOracles.setMedianRate(stableToken.address, defaultCeloStableTokenRate)
    await sortedOracles.setMedianTimestampToNow(stableToken.address)
    await sortedOracles.setNumRates(stableToken.address, 2)

    reserve = await MockReserve.new()
    await reserve.setGoldToken(goldToken.address)
    await registry.setAddressFor(CeloContractName.Reserve, reserve.address)
    // Give the reserve some CELO
    await goldToken.transfer(reserve.address, unit.times(50000), { from: owner })

    grandaMento = await GrandaMento.new(true)
    await grandaMento.initialize(registry.address, approver, spreadFixed, vetoPeriodSeconds)
    await grandaMento.setStableTokenExchangeLimits(
      stableTokenRegistryId,
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

    it('sets the approver', async () => {
      assert.equal(await grandaMento.approver(), approver)
    })

    it('sets the spread', async () => {
      assertEqualBN(await grandaMento.spread(), spreadFixed)
    })

    it('sets the vetoPeriodSeconds', async () => {
      assertEqualBN(await grandaMento.vetoPeriodSeconds(), vetoPeriodSeconds)
    })

    it('reverts when called again', async () => {
      await assertRevertWithReason(
        grandaMento.initialize(registry.address, approver, spreadFixed, vetoPeriodSeconds),
        'contract already initialized'
      )
    })
  })

  describe('#createExchangeProposal', () => {
    it('returns the proposal ID', async () => {
      const id = await grandaMento.createExchangeProposal.call(
        stableTokenRegistryId,
        stableTokenSellAmount,
        false // sellCelo = false as we are selling stableToken
      )
      assertEqualBN(id, 1)
    })

    it('increments the exchange proposal count', async () => {
      assertEqualBN(await grandaMento.exchangeProposalCount(), 0)
      await createExchangeProposal(false)
      assertEqualBN(await grandaMento.exchangeProposalCount(), 1)
    })

    it('assigns proposal IDs based off the exchange proposal count', async () => {
      const receipt1 = await createExchangeProposal(false)
      assertEqualBN(receipt1.logs[0].args.proposalId, 1)

      const receipt2 = await createExchangeProposal(false)
      assertEqualBN(receipt2.logs[0].args.proposalId, 2)
    })

    it('adds the exchange proposal to the activeProposalIds linked list', async () => {
      await createExchangeProposal(false)
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [new BigNumber(1)])

      // Add another
      await createExchangeProposal(false)
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
        new BigNumber(1),
        new BigNumber(2),
      ])
    })

    describe('when proposing an exchange that sells stable tokens', () => {
      // Celo token price quoted in CELO
      const stableTokenCeloRate = reciprocal(defaultCeloStableTokenRate)

      for (const inflationFactor of [1, 1.05]) {
        it(`emits the ExchangeProposalCreated event with the sell amount as the stable token value when its inflation factor is ${inflationFactor}`, async () => {
          await stableToken.setInflationFactor(toFixed(inflationFactor))

          const receipt = await createExchangeProposal(false)
          assertLogMatches2(receipt.logs[0], {
            event: 'ExchangeProposalCreated',
            args: {
              exchanger: owner,
              proposalId: 1,
              stableTokenRegistryId: stableTokenRegistryId,
              sellAmount: stableTokenSellAmount,
              buyAmount: getBuyAmount(
                stableTokenSellAmount,
                fromFixed(stableTokenCeloRate),
                spread
              ),
              sellCelo: false,
            },
          })
        })

        it(`stores the exchange proposal with the sell amount in units when the stable token inflation factor is ${inflationFactor}`, async () => {
          await stableToken.setInflationFactor(toFixed(inflationFactor))

          await createExchangeProposal(false)
          // 1 is the proposal ID
          const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(1))
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
          assert.equal(exchangeProposal.state, ExchangeProposalState.Proposed)
          assert.equal(exchangeProposal.sellCelo, false)
        })
      }

      it('deposits the stable tokens to be sold', async () => {
        const senderBalanceBefore = await stableToken.balanceOf(owner)
        const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
        await createExchangeProposal(false)
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
        await assertRevertWithReason(
          grandaMento.createExchangeProposal(
            stableTokenRegistryId,
            minExchangeAmount.minus(1),
            false // sellCelo = false as we are selling stableToken
          ),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the amount being sold is greater than the stable token max exchange amount', async () => {
        await assertRevertWithReason(
          grandaMento.createExchangeProposal(
            stableTokenRegistryId,
            maxExchangeAmount.plus(1),
            false // sellCelo = false as we are selling stableToken
          ),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the stable token has not had exchange limits set', async () => {
        // Add an entry for StableTokenEUR so the tx doesn't revert
        // as a result of the registry lookup.
        await registry.setAddressFor(CeloContractName.StableTokenEUR, stableToken.address)
        await assertRevertWithReason(
          grandaMento.createExchangeProposal(
            CeloContractName.StableTokenEUR,
            stableTokenSellAmount,
            false // sellCelo = false as we are selling stableToken
          ),
          'Stable token exchange amount must be defined'
        )
      })
    })

    describe('when proposing an exchange that sells CELO', () => {
      it('emits the ExchangeProposalCreated event', async () => {
        const receipt = await createExchangeProposal(true)
        assertLogMatches2(receipt.logs[0], {
          event: 'ExchangeProposalCreated',
          args: {
            exchanger: owner,
            proposalId: 1,
            stableTokenRegistryId: stableTokenRegistryId,
            sellAmount: celoSellAmount,
            buyAmount: getBuyAmount(celoSellAmount, fromFixed(defaultCeloStableTokenRate), spread),
            sellCelo: true,
          },
        })
      })

      it('stores the exchange proposal', async () => {
        await createExchangeProposal(true)
        // 1 is the proposal ID
        const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(1))
        assert.equal(exchangeProposal.exchanger, owner)
        assert.equal(exchangeProposal.stableToken, stableToken.address)
        assertEqualBN(exchangeProposal.sellAmount, celoSellAmount)
        assertEqualBN(
          exchangeProposal.buyAmount,
          getBuyAmount(celoSellAmount, fromFixed(defaultCeloStableTokenRate), spread)
        )
        assertEqualBN(exchangeProposal.approvalTimestamp, 0)
        assert.equal(exchangeProposal.state, ExchangeProposalState.Proposed)
        assert.equal(exchangeProposal.sellCelo, true)
      })

      it('deposits the CELO to be sold', async () => {
        const senderBalanceBefore = await goldToken.balanceOf(owner)
        const grandaMentoBalanceBefore = await goldToken.balanceOf(grandaMento.address)
        await createExchangeProposal(true)
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
        await assertRevertWithReason(
          grandaMento.createExchangeProposal(
            stableTokenRegistryId,
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
        await assertRevertWithReason(
          grandaMento.createExchangeProposal(
            stableTokenRegistryId,
            sellAmount,
            true // sellCelo = true as we are selling CELO
          ),
          'Stable token exchange amount not within limits'
        )
      })

      it('reverts if the stable token has not had exchange limits set', async () => {
        // Add an entry for StableTokenEUR so the tx doesn't revert
        // as a result of the registry lookup.
        await registry.setAddressFor(CeloContractName.StableTokenEUR, stableToken.address)
        await assertRevertWithReason(
          grandaMento.createExchangeProposal(
            CeloContractName.StableTokenEUR,
            celoSellAmount,
            true // sellCelo = true as we are selling CELO
          ),
          'Stable token exchange amount must be defined'
        )
      })
    })
  })

  describe('#approveExchangeProposal', () => {
    const proposalId = 1
    beforeEach(async () => {
      // Create an exchange proposal in the Proposed state with proposal ID 1
      await createExchangeProposal(false)
    })
    describe('when called by the approver', () => {
      it('emits the ExchangeProposalApproved event', async () => {
        const receipt = await grandaMento.approveExchangeProposal(proposalId, { from: approver })
        assertLogMatches2(receipt.logs[0], {
          event: 'ExchangeProposalApproved',
          args: {
            proposalId: 1,
          },
        })
      })

      it('changes an exchange proposal from the Proposed state to the Approved state', async () => {
        const proposalBefore = parseExchangeProposal(
          await grandaMento.exchangeProposals(proposalId)
        )
        // As a sanity check, make sure the exchange is in the Proposed state
        assert.equal(proposalBefore.state, ExchangeProposalState.Proposed)
        await grandaMento.approveExchangeProposal(proposalId, { from: approver })
        const proposalAfter = parseExchangeProposal(await grandaMento.exchangeProposals(proposalId))
        assert.equal(proposalAfter.state, ExchangeProposalState.Approved)
      })

      it('stores the timestamp of the approval', async () => {
        await grandaMento.approveExchangeProposal(proposalId, { from: approver })
        const latestBlock = await web3.eth.getBlock('latest')
        const proposal = parseExchangeProposal(await grandaMento.exchangeProposals(proposalId))
        assertEqualBN(proposal.approvalTimestamp, latestBlock.timestamp)
      })

      it('does not remove the exchange proposal from the activeProposalIds linked list', async () => {
        await grandaMento.approveExchangeProposal(proposalId, { from: approver })
        assertEqualBNArray(await grandaMento.getActiveProposalIds(), [new BigNumber(1)])
      })

      it('reverts if the exchange proposal does not exist', async () => {
        const nonexistentProposalId = 2
        const proposal = parseExchangeProposal(
          await grandaMento.exchangeProposals(nonexistentProposalId)
        )
        // As a sanity check, make sure the exchange is in the None state,
        // indicating it doesn't exist.
        assert.equal(proposal.state, ExchangeProposalState.None)
        await assertRevertWithReason(
          grandaMento.approveExchangeProposal(nonexistentProposalId, { from: approver }),
          'Proposal must be in Proposed state'
        )
      })
    })

    it('reverts if called by anyone other than the approver', async () => {
      await assertRevertWithReason(
        grandaMento.approveExchangeProposal(proposalId, { from: accounts[2] }),
        'Sender must be approver'
      )
    })
  })

  describe('#cancelExchangeProposal', () => {
    describe('when called by the exchanger', () => {
      beforeEach(async () => {
        await createExchangeProposal(false, alice)
      })

      it('changes an exchange proposal from the Proposed state to the Cancelled state', async () => {
        await grandaMento.cancelExchangeProposal(1, { from: alice })
        const exchangeProposalAfter = parseExchangeProposal(await grandaMento.exchangeProposals(1))
        assert.equal(exchangeProposalAfter.state, ExchangeProposalState.Cancelled)
      })

      it('reverts when the exchange proposal is not in the Proposed state', async () => {
        // Get the exchange into the Approved state.
        await grandaMento.approveExchangeProposal(1, { from: approver })
        // Try to have Alice cancel it when the exchange proposal is in the Approved state.
        await assertRevertWithReason(
          grandaMento.cancelExchangeProposal(1, { from: alice }),
          'Sender cannot cancel the exchange proposal'
        )
      })
    })

    describe('when called by the owner', () => {
      beforeEach(async () => {
        await createExchangeProposal(false, alice)
      })

      it('changes an exchange proposal from the Approved state to the Cancelled state', async () => {
        // Put it in the Approved state
        await grandaMento.approveExchangeProposal(1, { from: approver })
        // Now cancel it
        await grandaMento.cancelExchangeProposal(1, { from: owner })
        const exchangeProposalAfter = parseExchangeProposal(await grandaMento.exchangeProposals(1))
        assert.equal(exchangeProposalAfter.state, ExchangeProposalState.Cancelled)
      })

      it('reverts when the exchange proposal is not in the Approved state', async () => {
        // Try to cancel it when the exchange proposal is in the Proposed state.
        await assertRevertWithReason(
          grandaMento.cancelExchangeProposal(1, { from: owner }),
          'Sender cannot cancel the exchange proposal'
        )
      })
    })

    describe('when called by the appropriate sender for the proposal state', () => {
      it('emits the ExchangeProposalCancelled event', async () => {
        await createExchangeProposal(false, alice)
        const receipt = await grandaMento.cancelExchangeProposal(1, { from: alice })
        assertLogMatches2(receipt.logs[0], {
          event: 'ExchangeProposalCancelled',
          args: {
            proposalId: 1,
          },
        })
      })

      it('removes the exchange proposal from the activeProposalIds linked list', async () => {
        // proposalId 1
        await createExchangeProposal(false, alice)
        // proposalId 2
        await createExchangeProposal(false, alice)
        // proposalId 3
        await createExchangeProposal(false, alice)

        assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
          new BigNumber(1),
          new BigNumber(2),
          new BigNumber(3),
        ])
        // Remove 2
        await grandaMento.cancelExchangeProposal(2, { from: alice })
        assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
          new BigNumber(1),
          new BigNumber(3),
        ])
        // Remove 1
        await grandaMento.cancelExchangeProposal(1, { from: alice })
        assertEqualBNArray(await grandaMento.getActiveProposalIds(), [new BigNumber(3)])
        // Remove 3
        await grandaMento.cancelExchangeProposal(3, { from: alice })
        assertEqualBNArray(await grandaMento.getActiveProposalIds(), [])
      })

      describe('when selling the stable token', () => {
        beforeEach(async () => {
          await createExchangeProposal(false, alice)
        })

        it('refunds the same stable token amount as the original deposit when the inflation factor is 1', async () => {
          const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
          const aliceBalanceBefore = await stableToken.balanceOf(alice)
          await grandaMento.cancelExchangeProposal(1, { from: alice })
          const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
          const aliceBalanceAfter = await stableToken.balanceOf(alice)

          assertEqualBN(
            grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter),
            stableTokenSellAmount
          )
          assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), stableTokenSellAmount)
        })

        it('refunds the appropriate stable token amount value when the inflation factor is not 1', async () => {
          const inflationFactor = 1.1
          await stableToken.setInflationFactor(toFixed(inflationFactor))

          const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
          const aliceBalanceBefore = await stableToken.balanceOf(alice)
          await grandaMento.cancelExchangeProposal(1, { from: alice })
          const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
          const aliceBalanceAfter = await stableToken.balanceOf(alice)

          const valueAmount = unitsToValue(stableTokenSellAmount, inflationFactor)
          assertEqualBN(grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter), valueAmount)
          assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), valueAmount)
        })

        it('refunds the entire balance if the amount to refund is higher than the balance', async () => {
          const newGrandaMentoBalance = unit.times(400)
          // Remove some stableToken from granda mento to artificially simulate a situation
          // where the refund amount is > granda mento's balance.
          await stableToken.transferFrom(
            grandaMento.address,
            owner,
            stableTokenSellAmount.minus(newGrandaMentoBalance)
          )

          const aliceBalanceBefore = await stableToken.balanceOf(alice)
          await grandaMento.cancelExchangeProposal(1, { from: alice })
          const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
          const aliceBalanceAfter = await stableToken.balanceOf(alice)

          assertEqualBN(grandaMentoBalanceAfter, 0)
          assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), newGrandaMentoBalance)
        })
      })

      describe('when selling CELO', () => {
        it('refunds the same CELO amount as the original deposit', async () => {
          await goldToken.approve(grandaMento.address, celoSellAmount, { from: alice })
          await createExchangeProposal(true, alice)

          const grandaMentoBalanceBefore = await goldToken.balanceOf(grandaMento.address)
          const aliceBalanceBefore = await goldToken.balanceOf(alice)
          await grandaMento.cancelExchangeProposal(1, { from: alice })
          const grandaMentoBalanceAfter = await goldToken.balanceOf(grandaMento.address)
          const aliceBalanceAfter = await goldToken.balanceOf(alice)

          assertEqualBN(grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter), celoSellAmount)
          assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), celoSellAmount)
        })

        it('refunds the entire balance if the amount to refund is higher than the balance', async () => {
          const mockGoldToken = await MockGoldToken.new()
          await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
          await mockGoldToken.setBalanceOf(alice, celoSellAmount)

          await createExchangeProposal(true, alice)
          const newGrandaMentoBalance = unit.times(40)
          // Artificially lower the granda mento CELO balance.
          await mockGoldToken.setBalanceOf(grandaMento.address, newGrandaMentoBalance)

          const aliceBalanceBefore = await mockGoldToken.balanceOf(alice)
          await grandaMento.cancelExchangeProposal(1, { from: alice })
          const grandaMentoBalanceAfter = await mockGoldToken.balanceOf(grandaMento.address)
          const aliceBalanceAfter = await mockGoldToken.balanceOf(alice)

          assertEqualBN(grandaMentoBalanceAfter, 0)
          assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), newGrandaMentoBalance)
        })
      })
    })

    it('reverts when called by a sender that is not permitted', async () => {
      await createExchangeProposal(false, alice)
      await assertRevertWithReason(
        grandaMento.cancelExchangeProposal(1, { from: approver }),
        'Sender cannot cancel the exchange proposal'
      )
    })

    it('reverts when the proposalId does not exist', async () => {
      await assertRevertWithReason(
        grandaMento.cancelExchangeProposal(1, { from: approver }),
        'Sender cannot cancel the exchange proposal'
      )
    })
  })

  describe('#executeExchangeProposal', () => {
    let sellCelo = false
    beforeEach(async () => {
      await createExchangeProposal(sellCelo, alice)
    })
    describe('when the proposal is in the Approved state', () => {
      beforeEach(async () => {
        await grandaMento.approveExchangeProposal(1, { from: approver })
      })

      describe('when vetoPeriodSeconds has elapsed since the approval time', () => {
        beforeEach(async () => {
          await timeTravel(vetoPeriodSeconds, web3)
        })

        it('emits the ExchangeProposalExecuted event', async () => {
          const receipt = await grandaMento.executeExchangeProposal(1)
          assertLogMatches2(receipt.logs[0], {
            event: 'ExchangeProposalExecuted',
            args: {
              proposalId: 1,
            },
          })
        })

        it('changes an exchange proposal from the Approved state to the Executed state', async () => {
          await grandaMento.executeExchangeProposal(1)
          const exchangeProposalAfter = parseExchangeProposal(
            await grandaMento.exchangeProposals(1)
          )
          assert.equal(exchangeProposalAfter.state, ExchangeProposalState.Executed)
        })

        it('removes the exchange proposal from the activeProposalIds linked list', async () => {
          assertEqualBNArray(await grandaMento.getActiveProposalIds(), [new BigNumber(1)])
          await grandaMento.executeExchangeProposal(1)
          assertEqualBNArray(await grandaMento.getActiveProposalIds(), [])
        })

        describe('when selling stable token', () => {
          before(() => {
            sellCelo = false
          })

          it('burns the correct stable token value when the inflation factor is 1', async () => {
            const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
            const totalSupplyBefore = await stableToken.totalSupply()
            await grandaMento.executeExchangeProposal(1)
            const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
            const totalSupplyAfter = await stableToken.totalSupply()

            assertEqualBN(
              grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter),
              stableTokenSellAmount
            )
            assertEqualBN(totalSupplyBefore.minus(totalSupplyAfter), stableTokenSellAmount)
          })

          it('burns the correct stable token value when the inflation factor is not 1', async () => {
            const inflationFactor = 1.1
            await stableToken.setInflationFactor(toFixed(inflationFactor))

            const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
            const totalSupplyBefore = await stableToken.totalSupply()
            await grandaMento.executeExchangeProposal(1)
            const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
            const totalSupplyAfter = await stableToken.totalSupply()

            const sellAmountValue = unitsToValue(stableTokenSellAmount, inflationFactor)
            assertEqualBN(grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter), sellAmountValue)
            assertEqualBN(totalSupplyBefore.minus(totalSupplyAfter), sellAmountValue)
          })

          it('burns the entire stable token balance if the sell amount value is higher than the balance', async () => {
            const newGrandaMentoBalance = unit.times(400)
            // Transfer some stable token out of granda mento to simulate a situation
            // where granda mento has a balance < the sell amount
            await stableToken.transferFrom(
              grandaMento.address,
              owner,
              stableTokenSellAmount.minus(newGrandaMentoBalance)
            )

            const totalSupplyBefore = await stableToken.totalSupply()
            await grandaMento.executeExchangeProposal(1)
            const totalSupplyAfter = await stableToken.totalSupply()

            assertEqualBN(await stableToken.balanceOf(grandaMento.address), 0)
            assertEqualBN(totalSupplyBefore.minus(totalSupplyAfter), newGrandaMentoBalance)
          })

          it('transfers the buyAmount of CELO out of the Reserve to the exchanger', async () => {
            const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(1))
            const reserveBalanceBefore = await goldToken.balanceOf(reserve.address)
            const exchangerBalanceBefore = await goldToken.balanceOf(alice)
            await grandaMento.executeExchangeProposal(1)
            const reserveBalanceAfter = await goldToken.balanceOf(reserve.address)
            const exchangerBalanceAfter = await goldToken.balanceOf(alice)

            assertEqualBN(
              reserveBalanceBefore.minus(reserveBalanceAfter),
              exchangeProposal.buyAmount
            )
            assertEqualBN(
              exchangerBalanceAfter.minus(exchangerBalanceBefore),
              exchangeProposal.buyAmount
            )
          })
        })

        describe('when selling CELO', () => {
          before(() => {
            sellCelo = true
          })

          it('transfers the CELO to the Reserve', async () => {
            const grandaMentoBalanceBefore = await goldToken.balanceOf(grandaMento.address)
            const reserveBalanceBefore = await goldToken.balanceOf(reserve.address)
            await grandaMento.executeExchangeProposal(1)
            const grandaMentoBalanceAfter = await goldToken.balanceOf(grandaMento.address)
            const reserveBalanceAfter = await goldToken.balanceOf(reserve.address)

            assertEqualBN(reserveBalanceAfter.minus(reserveBalanceBefore), celoSellAmount)
            assertEqualBN(grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter), celoSellAmount)
          })

          it('transfers the entire CELO balance to the Reserve if the sell amount is higher than the balance', async () => {
            const newCeloSellAmount = unit.times(40)
            const mockGoldToken = await MockGoldToken.new()
            await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
            // Set the CELO balance to lower value
            await mockGoldToken.setBalanceOf(grandaMento.address, newCeloSellAmount)
            // Give the reserve a bunch of CELO
            await mockGoldToken.setBalanceOf(reserve.address, unit.times(50000))

            const reserveBalanceBefore = await mockGoldToken.balanceOf(reserve.address)
            await grandaMento.executeExchangeProposal(1)
            const reserveBalanceAfter = await mockGoldToken.balanceOf(reserve.address)

            assertEqualBN(await mockGoldToken.balanceOf(grandaMento.address), 0)
            assertEqualBN(reserveBalanceAfter.minus(reserveBalanceBefore), newCeloSellAmount)
          })

          it('mints the buyAmount of stable token to the exchanger', async () => {
            const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(1))
            const totalSupplyBefore = await stableToken.totalSupply()
            const exchangerBalanceBefore = await stableToken.balanceOf(alice)
            await grandaMento.executeExchangeProposal(1)
            const totalSupplyAfter = await stableToken.totalSupply()
            const exchangerBalanceAfter = await stableToken.balanceOf(alice)

            assertEqualBN(totalSupplyAfter.minus(totalSupplyBefore), exchangeProposal.buyAmount)
            assertEqualBN(
              exchangerBalanceAfter.minus(exchangerBalanceBefore),
              exchangeProposal.buyAmount
            )
          })
        })
      })

      it('reverts when the vetoPeriodSeconds has not elapsed since the approval time', async () => {
        // Traveling vetoPeriodSeconds - 1 can be flaky due to block times,
        // so instead just subtract by 10 to be safe.
        await timeTravel(vetoPeriodSeconds - 10, web3)
        await assertRevertWithReason(
          grandaMento.executeExchangeProposal(1),
          'Veto period not elapsed'
        )
      })
    })

    it('reverts when the proposal is not in the Approved state', async () => {
      await assertRevertWithReason(
        grandaMento.executeExchangeProposal(1),
        'Proposal must be in Approved state'
      )
    })

    it('reverts if the proposal has been previously executed', async () => {
      await grandaMento.approveExchangeProposal(1, { from: approver })
      await timeTravel(vetoPeriodSeconds, web3)
      // Execute it
      await grandaMento.executeExchangeProposal(1)
      // Try executing it again
      await assertRevertWithReason(
        grandaMento.executeExchangeProposal(1),
        'Proposal must be in Approved state'
      )
    })

    it('reverts when the proposalId does not exist', async () => {
      // No proposal exists with the ID 1
      await assertRevertWithReason(
        grandaMento.executeExchangeProposal(1),
        'Proposal must be in Approved state'
      )
    })
  })

  describe('#getBuyAmount', () => {
    const sellAmount = unit.times(500)
    describe('when selling stable token', () => {
      // Price of stableToken quoted in CELO
      const stableTokenCeloRate = fromFixed(defaultStableTokenCeloRate)
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
      await assertRevertWithReason(
        grandaMento.getBuyAmount(newStableToken.address, sellAmount, true),
        'No oracle rates present for token'
      )
    })
  })

  describe('#setApprover', () => {
    const newApprover = accounts[2]
    it('sets the approver', async () => {
      await grandaMento.setApprover(newApprover)
      assert.equal(await grandaMento.approver(), newApprover)
    })

    it('can set the approver to the zero address', async () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000'
      await grandaMento.setApprover(zeroAddress)
      assert.equal(await grandaMento.approver(), zeroAddress)
    })

    it('emits the ApproverSet event', async () => {
      const receipt = await grandaMento.setApprover(newApprover)
      assertLogMatches2(receipt.logs[0], {
        event: 'ApproverSet',
        args: {
          approver: newApprover,
        },
      })
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevertWithReason(
        grandaMento.setApprover(newApprover, { from: accounts[1] }),
        'Ownable: caller is not the owner'
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

    it('reverts when the spread is greater than 1', async () => {
      await assertRevertWithReason(
        grandaMento.setSpread(toFixed(1.0001)),
        'Spread must be smaller than 1'
      )
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevertWithReason(
        grandaMento.setSpread(newSpreadFixed, { from: accounts[1] }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#setStableTokenExchangeLimits', () => {
    const min = unit.times(123)
    const max = unit.times(321)
    it('sets the exchange limits for the provided stable token', async () => {
      await grandaMento.setStableTokenExchangeLimits(stableTokenRegistryId, min, max)
      const exchangeLimits = parseExchangeLimits(
        await grandaMento.stableTokenExchangeLimits(stableTokenRegistryId)
      )
      assertEqualBN(exchangeLimits.minExchangeAmount, min)
      assertEqualBN(exchangeLimits.maxExchangeAmount, max)
    })

    it('emits the StableTokenExchangeLimitsSet event', async () => {
      const receipt = await grandaMento.setStableTokenExchangeLimits(
        stableTokenRegistryId,
        min,
        max
      )
      assertLogMatches2(receipt.logs[0], {
        event: 'StableTokenExchangeLimitsSet',
        args: {
          stableTokenRegistryId,
          minExchangeAmount: min,
          maxExchangeAmount: max,
        },
      })
    })

    it('reverts when the minExchangeAmount is greater than the maxExchangeAmount', async () => {
      await assertRevertWithReason(
        grandaMento.setStableTokenExchangeLimits(stableTokenRegistryId, max, min),
        'Min exchange amount must not be greater than max'
      )
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevertWithReason(
        grandaMento.setStableTokenExchangeLimits(stableTokenRegistryId, min, max, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#getStableTokenExchangeLimits', () => {
    it('gets the exchange limits', async () => {
      const min = new BigNumber(123)
      const max = new BigNumber(321)
      await grandaMento.setStableTokenExchangeLimits(stableTokenRegistryId, min, max)
      const limits = await grandaMento.getStableTokenExchangeLimits(stableTokenRegistryId)
      assertEqualBN(limits['0'], min)
      assertEqualBN(limits['1'], max)
    })

    it('reverts if the exchange limits have not been set', async () => {
      // Add an entry for StableTokenEUR so the tx doesn't revert
      // as a result of the registry lookup.
      await registry.setAddressFor(CeloContractName.StableTokenEUR, stableToken.address)
      await assertRevertWithReason(
        grandaMento.getStableTokenExchangeLimits(CeloContractName.StableTokenEUR),
        'Stable token exchange amount must be defined'
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

function unitsToValue(value: BigNumber, inflationFactor: BigNumber.Value) {
  return value.idiv(inflationFactor)
}
