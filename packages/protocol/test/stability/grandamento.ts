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
import {
  GoldTokenContract,
  GoldTokenInstance,
  GrandaMentoContract,
  GrandaMentoInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
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
  proposalRaw: [
    string,
    string,
    BigNumber,
    any,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber
  ]
) {
  return {
    exchanger: proposalRaw[0],
    stableToken: proposalRaw[1],
    state: proposalRaw[2].toNumber() as ExchangeProposalState,
    sellCelo: typeof proposalRaw[3] === 'boolean' ? proposalRaw[3] : proposalRaw[3] === 'true',
    sellAmount: proposalRaw[4],
    buyAmount: proposalRaw[5],
    celoStableTokenExchangeRate: proposalRaw[6],
    vetoPeriodSeconds: proposalRaw[7],
    approvalTimestamp: proposalRaw[8],
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

  const maxApprovalExchangeRateChange = 0.3 // 30%
  const maxApprovalExchangeRateChangeFixed = toFixed(maxApprovalExchangeRateChange)

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
    registry = await Registry.new(true)

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
    await grandaMento.initialize(
      registry.address,
      approver,
      maxApprovalExchangeRateChangeFixed,
      spreadFixed,
      vetoPeriodSeconds
    )
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

    it('sets the maxApprovalExchangeRateChange', async () => {
      assertEqualBN(
        await grandaMento.maxApprovalExchangeRateChange(),
        maxApprovalExchangeRateChangeFixed
      )
    })

    it('sets the spread', async () => {
      assertEqualBN(await grandaMento.spread(), spreadFixed)
    })

    it('sets the vetoPeriodSeconds', async () => {
      assertEqualBN(await grandaMento.vetoPeriodSeconds(), vetoPeriodSeconds)
    })

    it('reverts when called again', async () => {
      await assertRevertWithReason(
        grandaMento.initialize(
          registry.address,
          approver,
          maxApprovalExchangeRateChangeFixed,
          spreadFixed,
          vetoPeriodSeconds
        ),
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

    it('adds the exchange proposal to the activeProposalIdsSuperset', async () => {
      await createExchangeProposal(false)
      assertEqualBN(await grandaMento.activeProposalIdsSuperset(0), new BigNumber(1))

      // Add another
      await createExchangeProposal(false)
      assertEqualBN(await grandaMento.activeProposalIdsSuperset(0), new BigNumber(1))
      assertEqualBN(await grandaMento.activeProposalIdsSuperset(1), new BigNumber(2))
    })

    for (const sellCelo of [true, false]) {
      let sellTokenString: string
      let sellAmount: BigNumber
      let oracleRate: BigNumber
      let sellToken: GoldTokenInstance | MockStableTokenInstance

      if (sellCelo) {
        sellTokenString = 'CELO'
        sellAmount = celoSellAmount
        oracleRate = defaultCeloStableTokenRate
      } else {
        sellTokenString = 'stable tokens'
        sellAmount = stableTokenSellAmount
        oracleRate = defaultStableTokenCeloRate
      }

      beforeEach(() => {
        // This must be done in beforeEach because goldToken and stableToken
        // are assigned in a previous beforeEach hook.
        sellToken = sellCelo ? goldToken : stableToken
      })

      describe(`when proposing an exchange that sells ${sellTokenString}`, () => {
        for (const inflationFactor of sellCelo ? [1] : [1, 1.1]) {
          it(`emits the ExchangeProposalCreated event${
            sellCelo
              ? ''
              : ` with the sell amount as the stable token value when its inflation factor is ${inflationFactor}`
          }`, async () => {
            if (!sellCelo) {
              await stableToken.setInflationFactor(toFixed(inflationFactor))
            }

            const receipt = await createExchangeProposal(sellCelo)
            assertLogMatches2(receipt.logs[0], {
              event: 'ExchangeProposalCreated',
              args: {
                exchanger: owner,
                proposalId: 1,
                stableTokenRegistryId,
                sellAmount,
                buyAmount: getBuyAmount(fromFixed(oracleRate), sellAmount, spread),
                sellCelo,
              },
            })
          })

          it(`stores the exchange proposal${
            sellCelo
              ? ''
              : ` with the sell amount in units when the stable token inflation factor is ${inflationFactor}`
          }`, async () => {
            if (!sellCelo) {
              await stableToken.setInflationFactor(toFixed(inflationFactor))
            }

            await createExchangeProposal(sellCelo)
            // 1 is the proposal ID
            const exchangeProposal = parseExchangeProposal(await grandaMento.exchangeProposals(1))
            assert.equal(exchangeProposal.exchanger, owner)
            assert.equal(exchangeProposal.stableToken, stableToken.address)
            assert.equal(exchangeProposal.state, ExchangeProposalState.Proposed)
            assert.equal(exchangeProposal.sellCelo, sellCelo)
            assertEqualBN(
              exchangeProposal.sellAmount,
              sellCelo ? sellAmount : valueToUnits(sellAmount, inflationFactor)
            )
            assertEqualBN(
              exchangeProposal.buyAmount,
              getBuyAmount(fromFixed(oracleRate), sellAmount, spread)
            )
            assertEqualBN(exchangeProposal.celoStableTokenExchangeRate, defaultCeloStableTokenRate)
            assertEqualBN(exchangeProposal.vetoPeriodSeconds, vetoPeriodSeconds)
            assertEqualBN(exchangeProposal.approvalTimestamp, 0)
          })
        }

        it(`deposits the ${sellTokenString} to be sold`, async () => {
          const senderBalanceBefore = await sellToken.balanceOf(owner)
          const grandaMentoBalanceBefore = await sellToken.balanceOf(grandaMento.address)
          await createExchangeProposal(sellCelo)
          const senderBalanceAfter = await sellToken.balanceOf(owner)
          const grandaMentoBalanceAfter = await sellToken.balanceOf(grandaMento.address)
          // Sender paid
          assertEqualBN(senderBalanceBefore.minus(senderBalanceAfter), sellAmount)
          // GrandaMento received
          assertEqualBN(grandaMentoBalanceAfter.minus(grandaMentoBalanceBefore), sellAmount)
        })

        it('reverts if the amount of stable token being exchanged is less than the stable token min exchange amount', async () => {
          const _sellAmount = sellCelo
            ? getSellAmount(minExchangeAmount, fromFixed(oracleRate), spread).minus(1)
            : minExchangeAmount.minus(1)

          await assertRevertWithReason(
            grandaMento.createExchangeProposal(stableTokenRegistryId, _sellAmount, sellCelo),
            'Stable token exchange amount not within limits'
          )
        })

        it('reverts if the amount of stable token being exchanged is greater than the stable token max exchange amount', async () => {
          const _sellAmount = sellCelo
            ? getSellAmount(maxExchangeAmount, fromFixed(oracleRate), spread).plus(1)
            : maxExchangeAmount.plus(1)
          await assertRevertWithReason(
            grandaMento.createExchangeProposal(stableTokenRegistryId, _sellAmount, sellCelo),
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
              sellCelo
            ),
            'Max stable token exchange amount must be defined'
          )
        })

        it('reverts when there is no oracle price for the stable token', async () => {
          await sortedOracles.setMedianRate(stableToken.address, 0)
          await assertRevertWithReason(
            grandaMento.createExchangeProposal(
              CeloContractName.StableToken,
              stableTokenSellAmount,
              sellCelo
            ),
            'No oracle rates present for token'
          )
        })
      })
    }
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

      for (const rateChange of [-maxApprovalExchangeRateChange, maxApprovalExchangeRateChange]) {
        it(`tolerates ${
          rateChange > 0 ? 'an increase' : 'a decrease'
        } in the exchange rate since exchange proposal creation within the maximum`, async () => {
          // The absolute max change
          const newCeloStableTokenRate = defaultCeloStableTokenRate.times(1 + rateChange)
          await sortedOracles.setMedianRate(stableToken.address, newCeloStableTokenRate)
          await grandaMento.approveExchangeProposal(proposalId, { from: approver })
        })
      }

      for (const rateChange of [
        -maxApprovalExchangeRateChange - 0.01,
        maxApprovalExchangeRateChange + 0.01,
      ]) {
        it(`reverts when ${
          rateChange > 0 ? 'an increase' : 'a decrease'
        } in the exchange rate since exchange proposal creation not within the maximum`, async () => {
          // Just in excess of the max change
          const newCeloStableTokenRate = defaultCeloStableTokenRate.times(1 + rateChange)
          await sortedOracles.setMedianRate(stableToken.address, newCeloStableTokenRate)
          await assertRevertWithReason(
            grandaMento.approveExchangeProposal(proposalId, { from: approver }),
            'CELO exchange rate is too different from the proposed price'
          )
        })
      }

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
          'Sender must be owner'
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
          'Sender must be exchanger'
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

      for (const sellCelo of [true, false]) {
        let sellTokenString: string
        let sellAmount: BigNumber
        let sellToken: GoldTokenInstance | MockGoldTokenInstance | MockStableTokenInstance

        if (sellCelo) {
          sellTokenString = 'CELO'
          sellAmount = celoSellAmount
        } else {
          sellTokenString = 'stable tokens'
          sellAmount = stableTokenSellAmount
        }

        describe(`when selling ${sellTokenString}`, () => {
          beforeEach(async () => {
            sellToken = sellCelo ? goldToken : stableToken
          })

          for (const inflationFactor of sellCelo ? [1] : [1, 1.1]) {
            it(`refunds the correct amount of ${sellTokenString}${
              sellCelo ? '' : ` when the inflation factor is ${inflationFactor}`
            }`, async () => {
              await createExchangeProposal(sellCelo, alice)
              if (!sellCelo) {
                await stableToken.setInflationFactor(toFixed(inflationFactor))
              }

              const grandaMentoBalanceBefore = await sellToken.balanceOf(grandaMento.address)
              const aliceBalanceBefore = await sellToken.balanceOf(alice)
              await grandaMento.cancelExchangeProposal(1, { from: alice })
              const grandaMentoBalanceAfter = await sellToken.balanceOf(grandaMento.address)
              const aliceBalanceAfter = await sellToken.balanceOf(alice)

              const valueAmount = sellCelo ? sellAmount : unitsToValue(sellAmount, inflationFactor)
              assertEqualBN(grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter), valueAmount)
              assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), valueAmount)
            })
          }

          it('refunds the entire balance if the amount to refund is higher than the balance', async () => {
            let newGrandaMentoBalance: BigNumber
            // Simulate a situation where the refund amount is greater than
            // Granda Mento's balance.
            if (sellCelo) {
              newGrandaMentoBalance = unit.times(40)
              const mockGoldToken = await MockGoldToken.new()
              sellToken = mockGoldToken
              await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
              await mockGoldToken.setBalanceOf(alice, celoSellAmount)

              await createExchangeProposal(sellCelo, alice)

              // Just directly set the balance of Granda Mento.
              await mockGoldToken.setBalanceOf(grandaMento.address, newGrandaMentoBalance)
            } else {
              newGrandaMentoBalance = unit.times(400)
              await createExchangeProposal(sellCelo, alice)
              // Remove some stableToken from granda mento to artificially simulate a situation
              // where the refund amount is > granda mento's balance.
              await stableToken.transferFrom(
                grandaMento.address,
                owner,
                stableTokenSellAmount.minus(newGrandaMentoBalance)
              )
            }

            const aliceBalanceBefore = await sellToken.balanceOf(alice)
            await grandaMento.cancelExchangeProposal(1, { from: alice })
            const grandaMentoBalanceAfter = await sellToken.balanceOf(grandaMento.address)
            const aliceBalanceAfter = await sellToken.balanceOf(alice)

            assertEqualBN(grandaMentoBalanceAfter, 0)
            assertEqualBN(aliceBalanceAfter.minus(aliceBalanceBefore), newGrandaMentoBalance)
          })
        })
      }
    })

    it('reverts when called by a sender that is not permitted', async () => {
      await createExchangeProposal(false, alice)
      await assertRevertWithReason(
        grandaMento.cancelExchangeProposal(1, { from: approver }),
        'Sender must be exchanger'
      )
    })

    it('reverts when the proposalId does not exist', async () => {
      await assertRevertWithReason(
        grandaMento.cancelExchangeProposal(1, { from: approver }),
        'Proposal must be in Proposed or Approved state'
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

        describe('when selling stable token', () => {
          before(() => {
            sellCelo = false
          })

          for (const inflationFactor of sellCelo ? [1] : [1, 1.1]) {
            it(`burns the correct stable token amount when the inflation factor is ${inflationFactor}`, async () => {
              await stableToken.setInflationFactor(toFixed(inflationFactor))

              const grandaMentoBalanceBefore = await stableToken.balanceOf(grandaMento.address)
              const totalSupplyBefore = await stableToken.totalSupply()
              await grandaMento.executeExchangeProposal(1)
              const grandaMentoBalanceAfter = await stableToken.balanceOf(grandaMento.address)
              const totalSupplyAfter = await stableToken.totalSupply()

              const valueAmount = unitsToValue(stableTokenSellAmount, inflationFactor)
              assertEqualBN(grandaMentoBalanceBefore.minus(grandaMentoBalanceAfter), valueAmount)
              assertEqualBN(totalSupplyBefore.minus(totalSupplyAfter), valueAmount)
            })
          }

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

      it("executes the proposal when time since approval is between the proposal's vetoPeriodSeconds and the contract's vetoPeriodSeconds", async () => {
        const newContractVetoPeriodSeconds = vetoPeriodSeconds * 2
        // Set the contract's vetoPeriodSeconds to a higher value than the proposal's
        // vetoPeriodSeconds to illustrate that the proposal's vetoPeriodSeconds is used
        // in the require.
        await grandaMento.setVetoPeriodSeconds(newContractVetoPeriodSeconds)
        await timeTravel(vetoPeriodSeconds, web3)
        await grandaMento.executeExchangeProposal(1)
      })

      it("reverts when the proposal's vetoPeriodSeconds has not elapsed since the approval time", async () => {
        // Set the contract's vetoPeriodSeconds to 0 to illustrate that
        // the proposal's vetoPeriodSeconds is used rather than the contract's
        // vetoPeriodSeconds.
        await grandaMento.setVetoPeriodSeconds(0)
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

  describe('#removeFromActiveProposalIdsSuperset', () => {
    beforeEach(async () => {
      // proposalId 1
      await createExchangeProposal(false, alice)
      // proposalId 2
      await createExchangeProposal(false, alice)
      // proposalId 3
      await createExchangeProposal(false, alice)
    })

    it('removes the exchange proposal from the activeProposalIdsSuperset', async () => {
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
        new BigNumber(1),
        new BigNumber(2),
        new BigNumber(3),
      ])
      // Remove ID 3
      await grandaMento.cancelExchangeProposal(3, { from: alice })
      // Remove ID 3, which is at index 2
      await grandaMento.removeFromActiveProposalIdsSuperset(2)
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
        new BigNumber(1),
        new BigNumber(2),
      ])

      // Remove ID 1
      await grandaMento.cancelExchangeProposal(1, { from: alice })
      // Remove ID 1, which is at index 0
      await grandaMento.removeFromActiveProposalIdsSuperset(0)
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [new BigNumber(2)])

      // Remove ID 2
      // Test with the exchange proposal being executed rather than cancelled
      await grandaMento.approveExchangeProposal(2, { from: approver })
      await timeTravel(vetoPeriodSeconds, web3)
      await grandaMento.executeExchangeProposal(2)
      // Remove ID 2, which is at index 0
      await grandaMento.removeFromActiveProposalIdsSuperset(0)
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [])
    })

    it('reverts if the exchange proposal is active', async () => {
      await assertRevertWithReason(
        grandaMento.removeFromActiveProposalIdsSuperset(0),
        'Exchange proposal not inactive'
      )
    })

    it('reverts if the provided index is out of bounds', async () => {
      await assertRevertWithReason(
        grandaMento.removeFromActiveProposalIdsSuperset(3),
        'Index out of bounds'
      )
    })
  })

  describe('#getActiveProposalIds', () => {
    beforeEach(async () => {
      // proposalId 1
      await createExchangeProposal(false, alice)
      // proposalId 2
      await createExchangeProposal(false, alice)
      // proposalId 3
      await createExchangeProposal(false, alice)
    })

    it('returns the active exchange proposal IDs when the superset has no inactive proposal IDs', async () => {
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
        new BigNumber(1),
        new BigNumber(2),
        new BigNumber(3),
      ])
    })

    it('returns the active exchange proposal IDs with 0s for any inactive proposal IDs in the superset', async () => {
      // cancel proposal ID 1
      await grandaMento.cancelExchangeProposal(1, { from: alice })
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
        new BigNumber(0),
        new BigNumber(2),
        new BigNumber(3),
      ])

      // execute proposal ID 3
      await grandaMento.approveExchangeProposal(3, { from: approver })
      await timeTravel(vetoPeriodSeconds, web3)
      await grandaMento.executeExchangeProposal(3)
      assertEqualBNArray(await grandaMento.getActiveProposalIds(), [
        new BigNumber(0),
        new BigNumber(2),
        new BigNumber(0),
      ])
    })
  })

  describe('#getBuyAmount', () => {
    const sellAmount = unit.times(500)

    for (const sellCelo of [true, false]) {
      const oracleRate = fromFixed(
        sellCelo ? defaultCeloStableTokenRate : defaultStableTokenCeloRate
      )
      describe('when selling stable token', () => {
        for (const _spread of [0, 0.01]) {
          it(`returns the amount being bought when the spread is ${_spread}`, async () => {
            await grandaMento.setSpread(toFixed(_spread))
            assertEqualBN(
              await grandaMento.getBuyAmount(defaultCeloStableTokenRate, sellAmount, sellCelo),
              getBuyAmount(oracleRate, sellAmount, _spread)
            )
          })
        }
      })
    }
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

  describe('#setMaxApprovalExchangeRateChange', () => {
    const newMaxApprovalExchangeRateChangeFixed = toFixed(0.4) // 40%
    it('sets the maxApprovalExchangeRateChange', async () => {
      await grandaMento.setMaxApprovalExchangeRateChange(newMaxApprovalExchangeRateChangeFixed)
      assertEqualBN(
        await grandaMento.maxApprovalExchangeRateChange(),
        newMaxApprovalExchangeRateChangeFixed
      )
    })

    it('emits the MaxApprovalExchangeRateChangeSet event', async () => {
      const receipt = await grandaMento.setMaxApprovalExchangeRateChange(
        newMaxApprovalExchangeRateChangeFixed
      )
      assertLogMatches2(receipt.logs[0], {
        event: 'MaxApprovalExchangeRateChangeSet',
        args: {
          maxApprovalExchangeRateChange: newMaxApprovalExchangeRateChangeFixed,
        },
      })
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevertWithReason(
        grandaMento.setMaxApprovalExchangeRateChange(newMaxApprovalExchangeRateChangeFixed, {
          from: accounts[1],
        }),
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
        'Max stable token exchange amount must be defined'
      )
    })
  })

  describe('#setVetoPeriodSeconds', () => {
    const newVetoPeriodSeconds = 60 * 60 * 24 * 7 // 7 days
    it('sets the spread', async () => {
      await grandaMento.setVetoPeriodSeconds(newVetoPeriodSeconds)
      assertEqualBN(await grandaMento.vetoPeriodSeconds(), newVetoPeriodSeconds)
    })

    it('emits the VetoPeriodSecondsSet event', async () => {
      const receipt = await grandaMento.setVetoPeriodSeconds(newVetoPeriodSeconds)
      assertLogMatches2(receipt.logs[0], {
        event: 'VetoPeriodSecondsSet',
        args: {
          vetoPeriodSeconds: newVetoPeriodSeconds,
        },
      })
    })

    it('reverts when the veto period is greater than 4 weeks', async () => {
      const fourWeeks = 60 * 60 * 24 * 7 * 4
      await assertRevertWithReason(
        grandaMento.setVetoPeriodSeconds(fourWeeks + 1),
        'Veto period cannot exceed 4 weeks'
      )
    })

    it('reverts when the sender is not the owner', async () => {
      await assertRevertWithReason(
        grandaMento.setVetoPeriodSeconds(newVetoPeriodSeconds, { from: accounts[1] }),
        'Ownable: caller is not the owner'
      )
    })
  })
})

// exchangeRate is the price of the sell token quoted in buy token
function getBuyAmount(exchangeRate: BigNumber, sellAmount: BigNumber, spread: BigNumber.Value) {
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
