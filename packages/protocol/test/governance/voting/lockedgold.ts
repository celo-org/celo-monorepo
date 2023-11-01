import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertDelegatorDelegateeAmounts,
  assertEqualBN,
  assertLogMatches,
  assertLogMatches2,
  assertRevert,
  assertTransactionRevertWithReason,
  createAndAssertDelegatorDelegateeSigners,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { ZERO_ADDRESS } from '@celo/protocol/test/constants'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  ElectionContract,
  ElectionTestInstance,
  LockedGoldContract,
  LockedGoldInstance,
  MockElectionContract,
  MockElectionInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
  MockGovernanceContract,
  MockGovernanceInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const LockedGold: LockedGoldContract = artifacts.require('LockedGold')
const Election: ElectionContract = artifacts.require('Election')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')
const MockGovernance: MockGovernanceContract = artifacts.require('MockGovernance')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'
// @ts-ignore
// TODO(mcortesi): Use BN
Election.numberFormat = 'BigNumber'

const HOUR = 60 * 60
const DAY = 24 * HOUR

/*
 * Helpers for verification
 */
export enum KeyOffsets {
  VALIDATING_KEY_OFFSET,
  ATTESTING_KEY_OFFSET,
  NEW_VALIDATING_KEY_OFFSET,
  VOTING_KEY_OFFSET,
}

contract('LockedGold', (accounts: string[]) => {
  const account = accounts[0]
  const nonOwner = accounts[1]
  const unlockingPeriod = 3 * DAY
  let accountsInstance: AccountsInstance
  let lockedGold: LockedGoldInstance
  let election: ElectionTestInstance
  let mockElection: MockElectionInstance
  let mockGovernance: MockGovernanceInstance
  let mockValidators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockGoldToken: MockGoldTokenInstance

  beforeEach(async () => {
    mockGoldToken = await MockGoldToken.new()
    accountsInstance = await Accounts.new(true)
    lockedGold = await LockedGold.new(true)
    mockElection = await MockElection.new()
    mockValidators = await MockValidators.new()
    mockGovernance = await MockGovernance.new()
    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
    await registry.setAddressFor(CeloContractName.Governance, mockGovernance.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await registry.setAddressFor(CeloContractName.LockedGold, lockedGold.address)
    await lockedGold.initialize(registry.address, unlockingPeriod)
    await accountsInstance.createAccount()
  })

  describe('#initialize()', () => {
    it('should set the owner', async () => {
      const owner: string = await lockedGold.owner()
      assert.equal(owner, account)
    })

    it('should set the registry address', async () => {
      const registryAddress: string = await lockedGold.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should set the unlocking period', async () => {
      const period = await lockedGold.unlockingPeriod()
      assertEqualBN(unlockingPeriod, period)
    })

    it('should revert if already initialized', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.initialize(registry.address, unlockingPeriod),
        'contract already initialized'
      )
    })
  })

  describe('#setRegistry()', () => {
    const anAddress: string = accounts[2]

    it('should set the registry when called by the owner', async () => {
      await lockedGold.setRegistry(anAddress)
      assert.equal(await lockedGold.registry(), anAddress)
    })

    it('should revert when not called by the owner', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.setRegistry(anAddress, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#setUnlockingPeriod', () => {
    const newUnlockingPeriod = unlockingPeriod + 1
    it('should set the unlockingPeriod', async () => {
      await lockedGold.setUnlockingPeriod(newUnlockingPeriod)
      assertEqualBN(await lockedGold.unlockingPeriod(), newUnlockingPeriod)
    })

    it('should emit the UnlockingPeriodSet event', async () => {
      const resp = await lockedGold.setUnlockingPeriod(newUnlockingPeriod)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'UnlockingPeriodSet',
        args: {
          period: newUnlockingPeriod,
        },
      })
    })

    it('should revert when the unlockingPeriod is unchanged', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.setUnlockingPeriod(unlockingPeriod),
        'Unlocking period not changed'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.setUnlockingPeriod(newUnlockingPeriod, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#lock()', () => {
    const value = 1000

    it("should increase the account's nonvoting locked gold balance", async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), value)
    })

    it("should increase the account's total locked gold balance", async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value)
    })

    it('should increase the nonvoting locked gold balance', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assertEqualBN(await lockedGold.getNonvotingLockedGold(), value)
    })

    it('should increase the total locked gold balance', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assertEqualBN(await lockedGold.getTotalLockedGold(), value)
    })

    it('should emit a GoldLocked event', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      const resp = await lockedGold.lock({ value })
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'GoldLocked', {
        account,
        value: new BigNumber(value),
      })
    })

    it('should revert when the account does not exist', async () => {
      await assertTransactionRevertWithReason(
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        lockedGold.lock({ value, from: accounts[1] }),
        'Must first register address with Account.createAccount'
      )
    })
  })

  describe('#unlock()', () => {
    const value = 1000
    let availabilityTime: BigNumber
    let resp: Truffle.TransactionResponse
    describe('when there are no balance requirements', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
      })
      describe('when the account is not voting in governance', () => {
        beforeEach(async () => {
          resp = await lockedGold.unlock(value)
          availabilityTime = new BigNumber(unlockingPeriod).plus(
            (await web3.eth.getBlock('latest')).timestamp
          )
        })

        it('should add a pending withdrawal #getPendingWithdrawal()', async () => {
          const [val, timestamp] = await lockedGold.getPendingWithdrawal(account, 0)
          assertEqualBN(val, value)
          assertEqualBN(timestamp, availabilityTime)
          await assertRevert(lockedGold.getPendingWithdrawal(account, 1))
        })

        it('should add a pending withdrawal #getPendingWithdrawals()', async () => {
          const [values, timestamps] = await lockedGold.getPendingWithdrawals(account)
          assert.equal(values.length, 1)
          assert.equal(timestamps.length, 1)
          assertEqualBN(values[0], value)
          assertEqualBN(timestamps[0], availabilityTime)
        })

        it("should decrease the account's nonvoting locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), 0)
        })

        it("should decrease the account's total locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), 0)
        })

        it('should decrease the nonvoting locked gold balance', async () => {
          assertEqualBN(await lockedGold.getNonvotingLockedGold(), 0)
        })

        it('should decrease the total locked gold balance', async () => {
          assertEqualBN(await lockedGold.getTotalLockedGold(), 0)
        })

        it('should emit a GoldUnlocked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertLogMatches(log, 'GoldUnlocked', {
            account,
            value: new BigNumber(value),
            available: availabilityTime,
          })
        })
      })

      describe('when the account is voting in governance', () => {
        const votingGold = 1
        const valueWithoutVotingGold = value - votingGold
        beforeEach(async () => {
          await mockGovernance.setVoting(account)
          await mockGovernance.setTotalVotes(account, votingGold)
        })

        it('should revert when requesting gold that is voted with', async () => {
          await assertTransactionRevertWithReason(
            lockedGold.unlock(value),
            'Not enough unlockable celo. Celo is locked in voting.'
          )
        })

        describe('when the account is requesting only non voting gold', () => {
          beforeEach(async () => {
            resp = await lockedGold.unlock(valueWithoutVotingGold)
            availabilityTime = new BigNumber(unlockingPeriod).plus(
              (await web3.eth.getBlock('latest')).timestamp
            )
          })

          it('should add a pending withdrawal #getPendingWithdrawal()', async () => {
            const [val, timestamp] = await lockedGold.getPendingWithdrawal(account, 0)
            assertEqualBN(val, valueWithoutVotingGold)
            assertEqualBN(timestamp, availabilityTime)
            await assertRevert(lockedGold.getPendingWithdrawal(account, 1))
          })

          it('should add a pending withdrawal #getPendingWithdrawals()', async () => {
            const [values, timestamps] = await lockedGold.getPendingWithdrawals(account)
            assert.equal(values.length, 1)
            assert.equal(timestamps.length, 1)
            assertEqualBN(values[0], valueWithoutVotingGold)
            assertEqualBN(timestamps[0], availabilityTime)
          })

          it("should decrease the account's nonvoting locked gold balance", async () => {
            assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), votingGold)
          })

          it("should decrease the account's total locked gold balance", async () => {
            assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), votingGold)
          })

          it('should decrease the nonvoting locked gold balance', async () => {
            assertEqualBN(await lockedGold.getNonvotingLockedGold(), votingGold)
          })

          it('should decrease the total locked gold balance', async () => {
            assertEqualBN(await lockedGold.getTotalLockedGold(), votingGold)
          })

          it('should emit a GoldUnlocked event', async () => {
            assert.equal(resp.logs.length, 1)
            const log = resp.logs[0]
            assertLogMatches(log, 'GoldUnlocked', {
              account,
              value: new BigNumber(valueWithoutVotingGold),
              available: availabilityTime,
            })
          })
        })
      })

      describe('when the account is delegating', () => {
        const delegatee = accounts[5]
        const percentToDelagate = 50
        const toUnlock = Math.ceil((value / 100) * (100 - percentToDelagate)) // 500
        const originallyDelegatedAmount = (value / 100) * percentToDelagate // 500

        beforeEach(async () => {
          await accountsInstance.createAccount({ from: delegatee })
          await lockedGold.delegateGovernanceVotes(delegatee, toFixed(percentToDelagate / 100))
          await mockGovernance.setTotalVotes(delegatee, originallyDelegatedAmount)
          await lockedGold.unlock(toUnlock)
        })

        it('should correctly unlock when getting less or equal to locked amount', async () => {
          const [val] = await lockedGold.getPendingWithdrawal(account, 0)
          assertEqualBN(val, toUnlock)
        })

        it('should correctly update delegated amount for delegatee', async () => {
          const [expected, real] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee
          )
          assertEqualBN(expected, originallyDelegatedAmount / 2)
          assertEqualBN(real, toUnlock / 2)
        })

        it('should decrease total delegated amount for delegatee', async () => {
          const delegateeTotalAmount = await lockedGold.totalDelegatedCelo(delegatee)
          assertEqualBN(delegateeTotalAmount, originallyDelegatedAmount / 2)
        })

        it('should call removeDelegatedVotes because voting for governance', async () => {
          const removeDelegatedVotes = await mockGovernance.removeVotesCalledFor(delegatee)
          assertEqualBN(removeDelegatedVotes, originallyDelegatedAmount / 2)
        })

        it('should correctly update delegator delegatee amount', async () => {
          const [fraction, currentAmount] = await lockedGold.getDelegatorDelegateeInfo(
            accounts[0],
            delegatee
          )
          assertEqualBN(fromFixed(fraction.multipliedBy(100)), percentToDelagate)
          assertEqualBN(currentAmount, originallyDelegatedAmount / 2)
        })

        describe('When all is unlocked', () => {
          beforeEach(async () => {
            await mockGovernance.setTotalVotes(delegatee, originallyDelegatedAmount / 2)
            await lockedGold.unlock(toUnlock)
          })

          it('should not remove delegatee from queue', async () => {
            const delegatees = await lockedGold.getDelegateesOfDelegator(accounts[0])
            assert.sameDeepMembers([delegatee], delegatees)
          })

          it('should correctly update delegator delegatee amount', async () => {
            const [fraction, currentAmount] = await lockedGold.getDelegatorDelegateeInfo(
              accounts[0],
              delegatee
            )
            assertEqualBN(fromFixed(fraction.multipliedBy(100)), percentToDelagate)
            assertEqualBN(currentAmount, 0)
          })
        })
      })

      describe('when the account is delegating to 2 delegatees', () => {
        const delegatee = accounts[5]
        const delegatee2 = accounts[6]
        const percentToDelagate = 50
        const toUnlock = Math.ceil((value / 100) * (100 - percentToDelagate)) + 1 // 501
        const originallyDelegatedAmount = (value / 100) * percentToDelagate // 500

        beforeEach(async () => {
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          await lockedGold.lock({ value: 1 })
          await accountsInstance.createAccount({ from: delegatee })
          await accountsInstance.createAccount({ from: delegatee2 })
          await lockedGold.delegateGovernanceVotes(delegatee, toFixed(percentToDelagate / 100))
          await lockedGold.delegateGovernanceVotes(delegatee2, toFixed(percentToDelagate / 100))
          await mockGovernance.setTotalVotes(delegatee, originallyDelegatedAmount)
          await mockGovernance.setTotalVotes(delegatee2, originallyDelegatedAmount)
          await lockedGold.unlock(toUnlock)
        })

        it('should correctly unlock when getting less or equal to locked amount', async () => {
          const [val] = await lockedGold.getPendingWithdrawal(account, 0)
          assertEqualBN(val, toUnlock)
        })

        it('should correctly update delegated amount for delegatee', async () => {
          const [expected, real] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee
          )
          assertEqualBN(expected, originallyDelegatedAmount / 2)
          assertEqualBN(real, Math.floor(toUnlock / 2))

          const [expected2, real2] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee2
          )
          assertEqualBN(expected2, originallyDelegatedAmount / 2)
          assertEqualBN(real2, Math.floor(toUnlock / 2))
        })

        it('should decrease total delegated amount for delegatee', async () => {
          const delegateeTotalAmount = await lockedGold.totalDelegatedCelo(delegatee)
          assertEqualBN(delegateeTotalAmount, originallyDelegatedAmount / 2)

          const delegateeTotalAmount2 = await lockedGold.totalDelegatedCelo(delegatee2)
          assertEqualBN(delegateeTotalAmount2, originallyDelegatedAmount / 2)
        })

        it('should call removeDelegatedVotes because voting for governance', async () => {
          const removeDelegatedVotes = await mockGovernance.removeVotesCalledFor(delegatee)
          assertEqualBN(removeDelegatedVotes, originallyDelegatedAmount / 2)

          const removeDelegatedVotes2 = await mockGovernance.removeVotesCalledFor(delegatee2)
          assertEqualBN(removeDelegatedVotes2, originallyDelegatedAmount / 2)
        })
      })

      describe('when the account is delegating to 3 delegatees', () => {
        const delegatee = accounts[5]
        const delegatee2 = accounts[6]
        const delegatee3 = accounts[7]
        const percentToDelagate = 33
        const toUnlock = 4

        beforeEach(async () => {
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          await lockedGold.unlock(995) // I have only 5 locked now
          await accountsInstance.createAccount({ from: delegatee })
          await accountsInstance.createAccount({ from: delegatee2 })
          await accountsInstance.createAccount({ from: delegatee3 })
          await lockedGold.delegateGovernanceVotes(delegatee, toFixed(percentToDelagate / 100))
          await lockedGold.delegateGovernanceVotes(delegatee2, toFixed(percentToDelagate / 100))
          await lockedGold.delegateGovernanceVotes(delegatee3, toFixed(percentToDelagate / 100))

          const [expected, real] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee
          )
          assertEqualBN(expected, 1)
          assertEqualBN(real, 1)

          const [expected2, real2] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee2
          )
          assertEqualBN(expected2, 1)
          assertEqualBN(real2, 1)

          const [expected3, real3] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee3
          )
          assertEqualBN(expected3, 1)
          assertEqualBN(real3, 1)
          await mockGovernance.setTotalVotes(delegatee, 1)
          await mockGovernance.setTotalVotes(delegatee2, 1)
          await mockGovernance.setTotalVotes(delegatee3, 1)

          await mockGovernance.removeVotesWhenRevokingDelegatedVotes(delegatee, 9999)
          await mockGovernance.removeVotesWhenRevokingDelegatedVotes(delegatee2, 9999)
          await mockGovernance.removeVotesWhenRevokingDelegatedVotes(delegatee3, 9999)

          resp = await lockedGold.unlock(toUnlock)
        })

        it('should correctly unlock when getting less or equal to locked amount', async () => {
          const [val] = await lockedGold.getPendingWithdrawal(account, 1)
          assertEqualBN(val, toUnlock)
        })

        it('should correctly update delegated amount for delegatee', async () => {
          const [expected, real] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee
          )
          assertEqualBN(expected, 0)
          assertEqualBN(real, 0)

          const [expected2, real2] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee2
          )
          assertEqualBN(expected2, 0)
          assertEqualBN(real2, 0)

          const [expected3, real3] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            accounts[0],
            delegatee3
          )
          assertEqualBN(expected3, 0)
          assertEqualBN(real3, 0)
        })

        it('should decrease total delegated amount for delegatee', async () => {
          const delegateeTotalAmount = await lockedGold.totalDelegatedCelo(delegatee)
          assertEqualBN(delegateeTotalAmount, 0)

          const delegateeTotalAmount2 = await lockedGold.totalDelegatedCelo(delegatee2)
          assertEqualBN(delegateeTotalAmount2, 0)
        })

        it('should call removeDelegatedVotes because voting for governance', async () => {
          const removeDelegatedVotes = await mockGovernance.removeVotesCalledFor(delegatee)
          assertEqualBN(removeDelegatedVotes, 0)

          const removeDelegatedVotes2 = await mockGovernance.removeVotesCalledFor(delegatee2)
          assertEqualBN(removeDelegatedVotes2, 0)

          const removeDelegatedVotes3 = await mockGovernance.removeVotesCalledFor(delegatee3)
          assertEqualBN(removeDelegatedVotes3, 0)
        })

        it('should emit the DelegatedCeloRevoked event', async () => {
          assert.equal(resp.logs.length, 4)
          assertLogMatches2(resp.logs[0], {
            event: 'DelegatedCeloRevoked',
            args: {
              delegator: accounts[0],
              delegatee,
              percent: 0,
              amount: 1,
            },
          })
          assertLogMatches2(resp.logs[1], {
            event: 'DelegatedCeloRevoked',
            args: {
              delegator: accounts[0],
              delegatee: delegatee2,
              percent: 0,
              amount: 1,
            },
          })
          assertLogMatches2(resp.logs[2], {
            event: 'DelegatedCeloRevoked',
            args: {
              delegator: accounts[0],
              delegatee: delegatee3,
              percent: 0,
              amount: 1,
            },
          })
        })
      })
    })

    describe('when there are balance requirements', () => {
      const balanceRequirement = 10
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        await mockValidators.setAccountLockedGoldRequirement(account, balanceRequirement)
      })

      describe('when unlocking would yield a locked gold balance less than the required value', () => {
        describe('when the the current time is earlier than the requirement time', () => {
          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              lockedGold.unlock(value),
              "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
            )
          })
        })
      })

      describe('when unlocking would yield a locked gold balance equal to the required value', () => {
        it('should succeed', async () => {
          await lockedGold.unlock(value - balanceRequirement)
        })
      })
    })
  })

  describe('#relock()', () => {
    const pendingWithdrawalValue = 1000
    const index = 0
    let resp: Truffle.TransactionResponse
    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value: pendingWithdrawalValue })
        await lockedGold.unlock(pendingWithdrawalValue)
      })

      describe('when relocking value equal to the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue
        beforeEach(async () => {
          resp = await lockedGold.relock(index, value)
        })

        it("should increase the account's nonvoting locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), value)
        })

        it("should increase the account's total locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value)
        })

        it('should increase the nonvoting locked gold balance', async () => {
          assertEqualBN(await lockedGold.getNonvotingLockedGold(), value)
        })

        it('should increase the total locked gold balance', async () => {
          assertEqualBN(await lockedGold.getTotalLockedGold(), value)
        })

        it('should emit a GoldRelocked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertLogMatches(log, 'GoldRelocked', {
            account,
            value: new BigNumber(value),
          })
        })

        it('should remove the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGold.getPendingWithdrawals(account)
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
        })
      })

      describe('when relocking value less than the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue - 1
        beforeEach(async () => {
          resp = await lockedGold.relock(index, value)
        })

        it("should increase the account's nonvoting locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), value)
        })

        it("should increase the account's total locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value)
        })

        it('should increase the nonvoting locked gold balance', async () => {
          assertEqualBN(await lockedGold.getNonvotingLockedGold(), value)
        })

        it('should increase the total locked gold balance', async () => {
          assertEqualBN(await lockedGold.getTotalLockedGold(), value)
        })

        it('should emit a GoldRelocked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertLogMatches(log, 'GoldRelocked', {
            account,
            value: new BigNumber(value),
          })
        })

        it('should decrement the value of the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGold.getPendingWithdrawals(account)
          assert.equal(values.length, 1)
          assert.equal(timestamps.length, 1)
          assertEqualBN(values[0], 1)
        })
      })
      describe('when relocking value greater than the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue + 1
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            lockedGold.relock(index, value),
            'Requested value larger than pending value'
          )
        })
      })
    })

    describe('When delegating', () => {
      const delegatee = accounts[5]

      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value: pendingWithdrawalValue })
        await accountsInstance.createAccount({ from: delegatee })
        await lockedGold.delegateGovernanceVotes(delegatee, toFixed(100 / 100))
        await lockedGold.unlock(pendingWithdrawalValue / 2)
        const [expected, real] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
          accounts[0],
          delegatee
        )
        assertEqualBN(expected, pendingWithdrawalValue / 2)
        assertEqualBN(real, pendingWithdrawalValue / 2)
      })

      it('should update delegated amount', async () => {
        await lockedGold.relock(index, pendingWithdrawalValue / 2)
        const [expected, real] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
          accounts[0],
          delegatee
        )
        assertEqualBN(expected, pendingWithdrawalValue)
        assertEqualBN(real, pendingWithdrawalValue)
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          lockedGold.relock(index, pendingWithdrawalValue),
          'Bad pending withdrawal index'
        )
      })
    })
  })

  describe('#withdraw()', () => {
    const value = 1000
    const index = 0
    let resp: Truffle.TransactionResponse
    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        resp = await lockedGold.unlock(value)
      })

      describe('when it is after the availablity time', () => {
        beforeEach(async () => {
          await timeTravel(unlockingPeriod, web3)
          resp = await lockedGold.withdraw(index)
        })

        it('should remove the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGold.getPendingWithdrawals(account)
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
        })

        it('should emit a GoldWithdrawn event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertLogMatches(log, 'GoldWithdrawn', {
            account,
            value: new BigNumber(value),
          })
        })
      })

      describe('when it is before the availablity time', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            lockedGold.withdraw(index),
            'Pending withdrawal not available'
          )
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          lockedGold.withdraw(index),
          'Bad pending withdrawal index'
        )
      })
    })
  })

  describe('#addSlasher', () => {
    beforeEach(async () => {
      await registry.setAddressFor(CeloContractName.DowntimeSlasher, accounts[2])
    })
    it('can add slasher to whitelist', async () => {
      await lockedGold.addSlasher(CeloContractName.DowntimeSlasher)
      const bytes = web3.utils.soliditySha3({
        type: 'string',
        value: CeloContractName.DowntimeSlasher,
      })
      assert.equal(bytes, (await lockedGold.getSlashingWhitelist())[0])
    })
    it('can only be called by owner', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.addSlasher(CeloContractName.DowntimeSlasher, { from: accounts[1] }),
        'Ownable: caller is not the owner'
      )
    })
    it('cannot add a slasher twice', async () => {
      await lockedGold.addSlasher(CeloContractName.DowntimeSlasher)
      await assertTransactionRevertWithReason(
        lockedGold.addSlasher(CeloContractName.DowntimeSlasher),
        'Cannot add slasher ID twice.'
      )
    })
  })

  describe('#removeSlasher', () => {
    beforeEach(async () => {
      await registry.setAddressFor(CeloContractName.DowntimeSlasher, accounts[2])
      await registry.setAddressFor(CeloContractName.GovernanceSlasher, accounts[3])
      await lockedGold.addSlasher(CeloContractName.DowntimeSlasher)
    })
    it('removes item for whitelist', async () => {
      await lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 0)
      assert.equal(0, (await lockedGold.getSlashingWhitelist()).length)
    })
    it('can only be called by owner', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 0, { from: accounts[1] }),
        'Ownable: caller is not the owner'
      )
    })
    it('reverts when index too large', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 100),
        'Provided index exceeds whitelist bounds.'
      )
    })
    it('reverts when key does not exists', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.removeSlasher(CeloContractName.GovernanceSlasher, 100),
        'Cannot remove slasher ID not yet added.'
      )
    })
    it('reverts when index and key have mismatch', async () => {
      await lockedGold.addSlasher(CeloContractName.GovernanceSlasher)
      await assertTransactionRevertWithReason(
        lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 1),
        "Index doesn't match identifier"
      )
    })
  })

  describe('#slash', () => {
    const value = 1000
    const group = accounts[1]
    const reporter = accounts[3]

    beforeEach(async () => {
      election = await Election.new(true)
      await registry.setAddressFor(CeloContractName.LockedGold, lockedGold.address)
      await election.initialize(
        registry.address,
        new BigNumber(4),
        new BigNumber(6),
        new BigNumber(3),
        toFixed(1 / 100)
      )
      await mockValidators.setMembers(group, [accounts[9]])
      await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      await registry.setAddressFor(CeloContractName.Election, election.address)
      await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
      await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      await mockValidators.setNumRegisteredValidators(1)
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      await registry.setAddressFor(CeloContractName.DowntimeSlasher, accounts[2])
      await lockedGold.addSlasher(CeloContractName.DowntimeSlasher)
      await accountsInstance.createAccount({ from: reporter })
    })

    describe('when the account is slashed for all of its locked gold', () => {
      const penalty = value
      const reward = value / 2

      beforeEach(async () => {
        await lockedGold.slash(
          account,
          penalty,
          reporter,
          reward,
          [NULL_ADDRESS],
          [NULL_ADDRESS],
          [0],
          { from: accounts[2] }
        )
      })

      it("should reduce account's locked gold balance", async () => {
        assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), value - penalty)
        assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value - penalty)
      })

      it("should increase the reporter's locked gold", async () => {
        assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(reporter), reward)
        assertEqualBN(await lockedGold.getAccountTotalLockedGold(reporter), reward)
      })

      it("should increase the community fund's gold", async () => {
        assert.equal(await web3.eth.getBalance(mockGovernance.address), penalty - reward)
      })
    })

    describe('When account is delegating', () => {
      const penalty = value
      const reward = value / 2

      const delegatee = accounts[5]

      beforeEach(async () => {
        await accountsInstance.createAccount({ from: delegatee })
        await lockedGold.delegateGovernanceVotes(delegatee, toFixed(100 / 100))
      })

      it('should update total voting power of delegatee', async () => {
        const totalAccountGovernanceVotingPower =
          await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
        assertEqualBN(totalAccountGovernanceVotingPower, value)
      })

      describe('When slashed', () => {
        beforeEach(async () => {
          await lockedGold.slash(
            account,
            penalty,
            reporter,
            reward,
            [NULL_ADDRESS],
            [NULL_ADDRESS],
            [0],
            { from: accounts[2] }
          )
        })

        it("should reduce account's locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), value - penalty)
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value - penalty)
        })
      })
    })

    describe('when the slashing contract is removed from `isSlasher`', () => {
      const penalty = value
      const reward = value / 2
      beforeEach(async () => {
        await lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 0)
      })

      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          lockedGold.slash(
            account,
            penalty,
            reporter,
            reward,
            [NULL_ADDRESS],
            [NULL_ADDRESS],
            [0],
            { from: accounts[2] }
          ),
          'Caller is not a whitelisted slasher.'
        )
      })
    })

    describe('when the account has half voting and half nonvoting gold', () => {
      const voting = value / 2
      const nonVoting = value - voting
      beforeEach(async () => {
        await election.vote(group, voting, NULL_ADDRESS, NULL_ADDRESS)
      })

      describe('when the account is slashed for only its nonvoting balance', () => {
        const penalty = nonVoting
        const reward = penalty / 2
        beforeEach(async () => {
          await lockedGold.slash(
            account,
            penalty,
            reporter,
            reward,
            [NULL_ADDRESS],
            [NULL_ADDRESS],
            [0],
            { from: accounts[2] }
          )
        })

        it("should reduce account's nonvoting locked gold balance", async () => {
          assertEqualBN(
            await lockedGold.getAccountNonvotingLockedGold(account),
            nonVoting - penalty
          )
        })

        it('should leave the voting locked gold', async () => {
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value - penalty)
          assertEqualBN(await election.getTotalVotesByAccount(account), voting)
        })

        it("should increase the reporter's locked gold", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(reporter), reward)
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(reporter), reward)
        })

        it("should increase the community fund's gold", async () => {
          assert.equal(await web3.eth.getBalance(mockGovernance.address), penalty - reward)
        })
      })

      describe('when the account is slashed for its whole balance', () => {
        const penalty = value
        const reward = penalty / 2

        beforeEach(async () => {
          await lockedGold.slash(
            account,
            penalty,
            reporter,
            reward,
            [NULL_ADDRESS],
            [NULL_ADDRESS],
            [0],
            { from: accounts[2] }
          )
        })

        it("should reduce account's nonvoting locked gold balance", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), value - penalty)
        })

        it("should reduce account's locked gold and voting gold", async () => {
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), value - penalty)
          assertEqualBN(await election.getTotalVotesByAccount(account), value - penalty)
        })

        it("should increase the reporter's locked gold", async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(reporter), reward)
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(reporter), reward)
        })

        it("should increase the community fund's gold", async () => {
          assert.equal(await web3.eth.getBalance(mockGovernance.address), penalty - reward)
        })
      })

      describe('when the account is slashed for more than its whole balance', () => {
        const penalty = value * 2
        const reward = value / 2

        beforeEach(async () => {
          await lockedGold.slash(
            account,
            penalty,
            reporter,
            reward,
            [NULL_ADDRESS],
            [NULL_ADDRESS],
            [0],
            { from: accounts[2] }
          )
        })

        it('should slash the whole accounts balance', async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(account), 0)
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(account), 0)
          assertEqualBN(await election.getTotalVotesByAccount(account), 0)
        })

        it('should still send the `reporter` `reward` gold', async () => {
          assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(reporter), reward)
          assertEqualBN(await lockedGold.getAccountTotalLockedGold(reporter), reward)
        })

        it("should only send the community fund value based on `account`'s total balance", async () => {
          assert.equal(await web3.eth.getBalance(mockGovernance.address), value - reward)
        })
      })
    })

    it('cannot be invoked by non-account reporters', async () => {
      const penalty = value
      const reward = value / 2

      await assertTransactionRevertWithReason(
        lockedGold.slash(
          account,
          penalty,
          accounts[4],
          reward,
          [NULL_ADDRESS],
          [NULL_ADDRESS],
          [0],
          { from: accounts[2] }
        ),
        'Must first register address with Account.createAccount'
      )
    })

    it('can be invoked by an account signer on behalf of the account', async () => {
      const signerReporter = accounts[4]
      const role = '0x0000000000000000000000000000000000000000000000000000000000001337'
      await accountsInstance.authorizeSigner(signerReporter, role, { from: reporter })
      await accountsInstance.completeSignerAuthorization(reporter, role, { from: signerReporter })
      const penalty = value
      const reward = value / 2

      await lockedGold.slash(
        account,
        penalty,
        signerReporter,
        reward,
        [NULL_ADDRESS],
        [NULL_ADDRESS],
        [0],
        { from: accounts[2] }
      )

      assertEqualBN(await lockedGold.getAccountNonvotingLockedGold(reporter), reward)
      assertEqualBN(await lockedGold.getAccountTotalLockedGold(reporter), reward)
    })
  })

  describe('#delegateGovernanceVotes', () => {
    it('should revert when delegatee is not account', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.delegateGovernanceVotes(ZERO_ADDRESS, toFixed(10 / 100)),
        'Must first register address with Account.createAccount'
      )
    })

    it('should revert when delegator is not an account', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.delegateGovernanceVotes(ZERO_ADDRESS, toFixed(10 / 100), { from: accounts[1] }),
        'Must first register address with Account.createAccount'
      )
    })

    describe('When delegatee is an account', () => {
      const delegatee1 = accounts[5]
      const delegatee2 = accounts[6]
      const delegatee3 = accounts[7]
      const delegator = accounts[0]
      const delegator2 = accounts[1]

      beforeEach(async () => {
        await accountsInstance.createAccount({ from: delegatee1 })
        await accountsInstance.createAccount({ from: delegatee2 })
        await accountsInstance.createAccount({ from: delegatee3 })
        await accountsInstance.createAccount({ from: delegator2 })
      })

      describe('When no vote signers', () => {
        describe('When no gold is locked', () => {
          let resp: Truffle.TransactionResponse
          const percentsToDelegate = 30
          const delegatedAmount = 0

          beforeEach(async () => {
            resp = await lockedGold.delegateGovernanceVotes(
              delegatee1,
              toFixed(percentsToDelegate / 100)
            )
          })

          it('should return correct delegated amounts', async () => {
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee1,
              percentsToDelegate,
              delegatedAmount,
              lockedGold
            )
            assertEqualBN(
              fromFixed(await lockedGold.getAccountTotalDelegatedFraction(delegator)).multipliedBy(
                100
              ),
              percentsToDelegate
            )
          })

          it('should emit the CeloDelegated event', async () => {
            assert.equal(resp.logs.length, 1)
            const log = resp.logs[0]
            assertLogMatches2(log, {
              event: 'CeloDelegated',
              args: {
                delegator,
                delegatee: delegatee1,
                percent: toFixed(percentsToDelegate / 100),
                amount: delegatedAmount,
              },
            })
          })
        })

        describe('When some gold is locked', () => {
          const value = 1000

          beforeEach(async () => {
            await lockedGold.lock({ value: value.toString(), from: delegator })
            await lockedGold.lock({ value: value.toString(), from: delegator2 })
          })

          it('should revert when delegating as validator', async () => {
            await mockValidators.setValidator(accounts[0])
            await assertTransactionRevertWithReason(
              lockedGold.delegateGovernanceVotes(delegatee1, toFixed(10 / 100)),
              'Validators cannot delegate votes.'
            )
          })

          it('should revert when delegating as validator group', async () => {
            await mockValidators.setValidatorGroup(accounts[0])
            await assertTransactionRevertWithReason(
              lockedGold.delegateGovernanceVotes(delegatee1, 10),
              'Validator groups cannot delegate votes.'
            )
          })

          describe('When delegatee account is registered', () => {
            const percentsToDelegate = 10
            const delegatedAmount = (value / 100) * percentsToDelegate
            beforeEach(async () => {
              assertEqualBN(await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 0)
              assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1), 0)
              assertEqualBN(await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), 0)
              assertEqualBN(await lockedGold.totalDelegatedCelo(delegator), 0)
              assertEqualBN(await lockedGold.getAccountTotalDelegatedFraction(delegator), 0)
            })

            it('should revert when incorrect percent amount is inserted', async () => {
              await assertTransactionRevertWithReason(
                lockedGold.delegateGovernanceVotes(ZERO_ADDRESS, toFixed(101 / 100)),
                'Delegate fraction must be less than or equal to 1'
              )
            })

            describe('When delegator is voting in referendum', () => {
              beforeEach(async () => {
                await mockGovernance.setTotalVotes(delegator, 1)
              })

              it('should revert when delagating votes that are currently voting for proposal', async () => {
                await assertTransactionRevertWithReason(
                  lockedGold.delegateGovernanceVotes(delegatee1, toFixed(100 / 100)),
                  'Cannot delegate votes that are voting in referendum'
                )
              })

              it('should revert when voting for proposal with votes that are currently used in referendum (2 delegatees)', async () => {
                await lockedGold.delegateGovernanceVotes(delegatee1, toFixed(99 / 100))
                await assertTransactionRevertWithReason(
                  lockedGold.delegateGovernanceVotes(delegatee2, toFixed(1 / 100)),
                  'Cannot delegate votes that are voting in referendum'
                )
              })

              it('should delegate when voting for less than requested for delegation', async () => {
                await lockedGold.delegateGovernanceVotes(delegatee1, toFixed(99 / 100))
              })
            })

            describe('When delegating to delegatee1', () => {
              let resp: Truffle.TransactionResponse
              beforeEach(async () => {
                resp = await lockedGold.delegateGovernanceVotes(
                  delegatee1,
                  toFixed(percentsToDelegate / 100)
                )
              })
              it('should revert when delegating more than 100% in two steps (different delegatees)', async () => {
                await assertTransactionRevertWithReason(
                  lockedGold.delegateGovernanceVotes(delegatee2, toFixed(100 / 100)),
                  'Cannot delegate more than 100%'
                )
              })

              it('should delegate correctly when delegated to same account in two steps', async () => {
                assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount)
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount
                )
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  percentsToDelegate
                )
                await lockedGold.delegateGovernanceVotes(delegatee1, toFixed(100 / 100))
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  value
                )
                await assertDelegatorDelegateeAmounts(delegator, delegatee1, 100, value, lockedGold)
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  100
                )
              })

              it('should emit the CeloDelegated event', async () => {
                assert.equal(resp.logs.length, 1)
                const log = resp.logs[0]
                assertLogMatches2(log, {
                  event: 'CeloDelegated',
                  args: {
                    delegator,
                    delegatee: delegatee1,
                    percent: toFixed(percentsToDelegate / 100),
                    amount: delegatedAmount,
                  },
                })
              })

              it('should delegate votes correctly', async () => {
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
              })

              it('should delegate votes correctly to multiple accounts', async () => {
                await lockedGold.delegateGovernanceVotes(
                  delegatee2,
                  toFixed(percentsToDelegate / 100)
                )

                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount
                )
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2),
                  delegatedAmount
                )

                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee2,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
              })

              describe('When locked more gold and redelagate', () => {
                let resp2: Truffle.TransactionResponse
                beforeEach(async () => {
                  await lockedGold.lock({ value: value.toString(), from: delegator })
                  resp2 = await lockedGold.delegateGovernanceVotes(
                    delegatee1,
                    toFixed(percentsToDelegate / 100)
                  )
                })

                it('should delegate votes correctly', async () => {
                  assertEqualBN(
                    await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                    delegatedAmount * 2
                  )
                  await assertDelegatorDelegateeAmounts(
                    delegator,
                    delegatee1,
                    percentsToDelegate,
                    delegatedAmount * 2,
                    lockedGold
                  )
                })

                it('should emit the CeloDelegated event', async () => {
                  assert.equal(resp2.logs.length, 1)
                  const log = resp2.logs[0]
                  assertLogMatches2(log, {
                    event: 'CeloDelegated',
                    args: {
                      delegator,
                      delegatee: delegatee1,
                      percent: toFixed(percentsToDelegate / 100),
                      amount: delegatedAmount * 2,
                    },
                  })
                })
              })
            })

            describe('When 2 delegators are delegating to delegatee1', () => {
              beforeEach(async () => {
                await lockedGold.delegateGovernanceVotes(
                  delegatee1,
                  toFixed(percentsToDelegate / 100),
                  {
                    from: delegator,
                  }
                )
                await lockedGold.delegateGovernanceVotes(
                  delegatee1,
                  toFixed(percentsToDelegate / 100),
                  {
                    from: delegator2,
                  }
                )
              })

              it('should delegate votes correctly', async () => {
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount * 2
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )

                await assertDelegatorDelegateeAmounts(
                  delegator2,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
              })
            })
          })
        })
      })

      describe('When vote signers', () => {
        describe('When some gold is locked', () => {
          const value = 1000
          let delegatorSigner
          let delegatorSigner2
          let delegateeSigner1
          let delegateeSigner2

          beforeEach(async () => {
            await lockedGold.lock({ value: value.toString(), from: delegator })
            await lockedGold.lock({ value: value.toString(), from: delegator2 })
            ;[delegatorSigner, delegateeSigner1] = await createAndAssertDelegatorDelegateeSigners(
              accountsInstance,
              accounts,
              delegator,
              delegatee1
            )
            ;[delegatorSigner2, delegateeSigner2] = await createAndAssertDelegatorDelegateeSigners(
              accountsInstance,
              accounts,
              delegator2,
              delegatee2
            )
          })

          describe('When delegatee account is registered', () => {
            const percentsToDelegate = 10
            const delegatedAmount = (value / 100) * percentsToDelegate
            beforeEach(async () => {
              assertEqualBN(await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 0)
              assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1), 0)
              assertEqualBN(await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), 0)
              assertEqualBN(await lockedGold.totalDelegatedCelo(delegator), 0)
              assertEqualBN(await lockedGold.getAccountTotalDelegatedFraction(delegator), 0)
            })

            it('should revert when incorrect percent amount is inserted', async () => {
              await assertTransactionRevertWithReason(
                lockedGold.delegateGovernanceVotes(ZERO_ADDRESS, toFixed(101 / 100)),
                'Delegate fraction must be less than or equal to 1'
              )
            })

            describe('When delegator is voting in referendum', () => {
              beforeEach(async () => {
                await mockGovernance.setTotalVotes(delegator, 1)
              })

              it('should revert when delegating votes that are currently voting for proposal', async () => {
                await assertTransactionRevertWithReason(
                  lockedGold.delegateGovernanceVotes(delegateeSigner1, toFixed(100 / 100), {
                    from: delegatorSigner,
                  }),
                  'Cannot delegate votes that are voting in referendum'
                )
              })

              it('should revert when voting for proposal with votes that are currently used in referendum (2 delegatees)', async () => {
                await lockedGold.delegateGovernanceVotes(delegateeSigner1, toFixed(99 / 100), {
                  from: delegator,
                })
                await assertTransactionRevertWithReason(
                  lockedGold.delegateGovernanceVotes(delegateeSigner2, toFixed(1 / 100), {
                    from: delegator,
                  }),
                  'Cannot delegate votes that are voting in referendum'
                )
              })

              it('should delegate when voting for less than requested for delegation', async () => {
                await lockedGold.delegateGovernanceVotes(delegateeSigner1, toFixed(99 / 100), {
                  from: delegatorSigner,
                })
              })
            })

            describe('When delegating to delegatee1', () => {
              let resp: Truffle.TransactionResponse
              beforeEach(async () => {
                resp = await lockedGold.delegateGovernanceVotes(
                  delegateeSigner1,
                  toFixed(percentsToDelegate / 100),
                  { from: delegatorSigner }
                )
              })
              it('should revert when delegating more than 100% in two steps (different delegatees)', async () => {
                await assertTransactionRevertWithReason(
                  lockedGold.delegateGovernanceVotes(delegateeSigner2, toFixed(100 / 100), {
                    from: delegatorSigner,
                  }),
                  'Cannot delegate more than 100%'
                )
              })

              it('should delegate correctly when delegated to same account in two steps', async () => {
                assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount)
                assertEqualBN(await lockedGold.totalDelegatedCelo(delegateeSigner1), 0)
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount
                )
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegateeSigner1),
                  0
                )
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  percentsToDelegate
                )
                assertEqualBN(
                  fromFixed(await lockedGold.getAccountTotalDelegatedFraction(delegatorSigner)),
                  0
                )
                await lockedGold.delegateGovernanceVotes(delegateeSigner1, toFixed(100 / 100), {
                  from: delegatorSigner,
                })
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  value
                )
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegateeSigner1),
                  0
                )
                await assertDelegatorDelegateeAmounts(delegator, delegatee1, 100, value, lockedGold)
                await assertDelegatorDelegateeAmounts(
                  delegatorSigner,
                  delegateeSigner1,
                  0,
                  0,
                  lockedGold
                )
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  100
                )
                assertEqualBN(await lockedGold.getAccountTotalDelegatedFraction(delegatorSigner), 0)
              })

              it('should emit the CeloDelegated event', async () => {
                assert.equal(resp.logs.length, 1)
                const log = resp.logs[0]
                assertLogMatches2(log, {
                  event: 'CeloDelegated',
                  args: {
                    delegator,
                    delegatee: delegatee1,
                    percent: toFixed(percentsToDelegate / 100),
                    amount: delegatedAmount,
                  },
                })
              })

              it('should delegate votes correctly', async () => {
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
              })

              it('should delegate votes correctly to multiple accounts', async () => {
                await lockedGold.delegateGovernanceVotes(
                  delegateeSigner2,
                  toFixed(percentsToDelegate / 100),
                  {
                    from: delegatorSigner,
                  }
                )

                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount
                )

                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegateeSigner1),
                  0
                )
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2),
                  delegatedAmount
                )

                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegateeSigner2),
                  0
                )

                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee2,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
              })

              describe('When locked more gold and redelagate', () => {
                let resp2: Truffle.TransactionResponse
                beforeEach(async () => {
                  await lockedGold.lock({ value: value.toString(), from: delegator })
                  resp2 = await lockedGold.delegateGovernanceVotes(
                    delegateeSigner1,
                    toFixed(percentsToDelegate / 100),
                    { from: delegatorSigner }
                  )
                })

                it('should delegate votes correctly', async () => {
                  assertEqualBN(
                    await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                    delegatedAmount * 2
                  )
                  await assertDelegatorDelegateeAmounts(
                    delegator,
                    delegatee1,
                    percentsToDelegate,
                    delegatedAmount * 2,
                    lockedGold
                  )
                })

                it('should emit the CeloDelegated event', async () => {
                  assert.equal(resp2.logs.length, 1)
                  const log = resp2.logs[0]
                  assertLogMatches2(log, {
                    event: 'CeloDelegated',
                    args: {
                      delegator,
                      delegatee: delegatee1,
                      percent: toFixed(percentsToDelegate / 100),
                      amount: delegatedAmount * 2,
                    },
                  })
                })
              })
            })

            describe('When 2 delegators are delegating to delegatee1', () => {
              beforeEach(async () => {
                await lockedGold.delegateGovernanceVotes(
                  delegateeSigner1,
                  toFixed(percentsToDelegate / 100),
                  {
                    from: delegatorSigner,
                  }
                )
                await lockedGold.delegateGovernanceVotes(
                  delegateeSigner1,
                  toFixed(percentsToDelegate / 100),
                  {
                    from: delegatorSigner2,
                  }
                )
              })

              it('should delegate votes correctly', async () => {
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount * 2
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )

                await assertDelegatorDelegateeAmounts(
                  delegator2,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
              })
            })
          })
        })
      })

      describe('When trying to delegate to more then maxDelegateeCount', () => {
        const value = 1000

        beforeEach(async () => {
          await lockedGold.setMaxDelegateesCount(2)
          await lockedGold.lock({ value: value.toString(), from: delegator })
        })

        describe('When delegated to allow count yet', () => {
          beforeEach(async () => {
            await lockedGold.delegateGovernanceVotes(delegatee1, toFixed(1 / 100), {
              from: delegator,
            })
            await lockedGold.delegateGovernanceVotes(delegatee2, toFixed(1 / 100), {
              from: delegator,
            })
          })

          it('should return delegatees correctly', async () => {
            const delegatees = await lockedGold.getDelegateesOfDelegator(delegator)
            assert.sameDeepMembers([delegatee1, delegatee2], delegatees)
          })

          it('should revert when trying to add extra delegatee', async () => {
            await assertTransactionRevertWithReason(
              lockedGold.delegateGovernanceVotes(delegatee3, toFixed(1 / 100), { from: delegator }),
              'Too many delegatees'
            )
          })

          describe('When limit is increased', () => {
            beforeEach(async () => {
              await lockedGold.setMaxDelegateesCount(3)
            })

            it('should allow to increase number of validators', async () => {
              await lockedGold.delegateGovernanceVotes(delegatee3, toFixed(1 / 100), {
                from: delegator,
              })
            })
          })
        })
      })

      describe('When trying to delegate to more then maxDelegateeCount with vote signers', () => {
        const value = 1000
        let delegatorSigner: string
        let delegateeSigner1: string
        let delegateeSigner2: string
        let delegateeSigner3: string

        beforeEach(async () => {
          await lockedGold.setMaxDelegateesCount(2)
          await lockedGold.lock({ value: value.toString(), from: delegator })
          ;[delegatorSigner, delegateeSigner1] = await createAndAssertDelegatorDelegateeSigners(
            accountsInstance,
            accounts,
            delegator,
            delegatee1
          )
          ;[delegateeSigner3, delegateeSigner2] = await createAndAssertDelegatorDelegateeSigners(
            accountsInstance,
            accounts,
            delegatee3,
            delegatee2
          )
        })

        describe('When delegated to allow count yet', () => {
          beforeEach(async () => {
            await lockedGold.delegateGovernanceVotes(delegateeSigner1, toFixed(1 / 100), {
              from: delegatorSigner,
            })
            await lockedGold.delegateGovernanceVotes(delegateeSigner2, toFixed(1 / 100), {
              from: delegatorSigner,
            })
          })

          it('should return delegatees correctly', async () => {
            const delegatees = await lockedGold.getDelegateesOfDelegator(delegator)
            assert.sameDeepMembers([delegatee1, delegatee2], delegatees)
          })

          it('should revert when trying to add extra delegatee', async () => {
            await assertTransactionRevertWithReason(
              lockedGold.delegateGovernanceVotes(delegateeSigner3, toFixed(1 / 100), {
                from: delegatorSigner,
              }),
              'Too many delegatees'
            )
          })

          describe('When limit is increased', () => {
            beforeEach(async () => {
              await lockedGold.setMaxDelegateesCount(3)
            })

            it('should allow to increase number of validators', async () => {
              await lockedGold.delegateGovernanceVotes(delegateeSigner3, toFixed(1 / 100), {
                from: delegatorSigner,
              })
            })
          })
        })
      })
    })
  })

  describe('#revokeDelegatedGovernanceVotes()', () => {
    it('should revert when incorrect percent amount is inserted', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.revokeDelegatedGovernanceVotes(ZERO_ADDRESS, toFixed(101 / 100)),
        'Revoke fraction must be less than or equal to 1'
      )
    })

    it('should revert when nothing delegated', async () => {
      await assertTransactionRevertWithReason(
        lockedGold.revokeDelegatedGovernanceVotes(ZERO_ADDRESS, toFixed(10 / 100)),
        'Not enough total delegated percents'
      )
    })

    describe('When no vote signers', () => {
      describe('When having delegated amount', () => {
        const value = 1000
        const delegator = accounts[0]
        const delegator2 = accounts[1]
        const delegatee1 = accounts[5]
        const delegatee2 = accounts[6]

        const percentsToDelegate = 10
        const delegatedAmount = (value / 100) * percentsToDelegate

        beforeEach(async () => {
          await accountsInstance.createAccount({ from: delegator2 })
          await accountsInstance.createAccount({ from: delegatee1 })
          await accountsInstance.createAccount({ from: delegatee2 })

          await lockedGold.lock({ value: value.toString(), from: delegator })
          await lockedGold.lock({ value: value.toString(), from: delegator2 })

          await lockedGold.delegateGovernanceVotes(delegatee1, toFixed(percentsToDelegate / 100))
          assertEqualBN(
            await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
            delegatedAmount
          )
          assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount)
        })

        it('should revert when trying to revert more percent than delegated', async () => {
          await assertTransactionRevertWithReason(
            lockedGold.revokeDelegatedGovernanceVotes(ZERO_ADDRESS, toFixed(100 / 100)),
            'Not enough total delegated percents'
          )
        })

        describe('When revoking from delegatee1', () => {
          const percentageToRevoke = 2
          const amountToRevoke = (value / 100) * percentageToRevoke
          let resp: Truffle.TransactionResponse

          beforeEach(async () => {
            resp = await lockedGold.revokeDelegatedGovernanceVotes(
              delegatee1,
              toFixed(percentageToRevoke / 100)
            )
          })

          it('should revoke votes correctly when delegatee not voting', async () => {
            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
              delegatedAmount - amountToRevoke
            )
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee1,
              percentsToDelegate - percentageToRevoke,
              delegatedAmount - amountToRevoke,
              lockedGold
            )

            assertEqualBN(
              await lockedGold.totalDelegatedCelo(delegatee1),
              delegatedAmount - amountToRevoke
            )
          })

          it('should emit the DelegatedCeloRevoked event', async () => {
            assert.equal(resp.logs.length, 1)
            const log = resp.logs[0]
            assertLogMatches2(log, {
              event: 'DelegatedCeloRevoked',
              args: {
                delegator,
                delegatee: delegatee1,
                percent: toFixed(percentageToRevoke / 100),
                amount: amountToRevoke,
              },
            })
          })

          describe('When delegator1 locked more gold + delegator2 also delegated to delegatee1', () => {
            beforeEach(async () => {
              assertEqualBN(
                await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                delegatedAmount - amountToRevoke
              )
              await lockedGold.delegateGovernanceVotes(
                delegatee1,
                toFixed(percentsToDelegate / 100),
                {
                  from: delegator2,
                }
              )
              assertEqualBN(
                await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                delegatedAmount + (delegatedAmount - amountToRevoke)
              )
              await lockedGold.lock({ value: value.toString(), from: delegator })
            })

            describe('When revoking percentage such as that with newly locked amount it would decrease below zero', () => {
              const percentageToRevokeAfterLock = 6
              const votingCeloPercent = 100
              const votingAmount =
                ((delegatedAmount * 2 - amountToRevoke) / 100) * votingCeloPercent

              beforeEach(async () => {
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  percentsToDelegate - percentageToRevoke
                )
                await mockGovernance.setTotalVotes(delegatee1, votingAmount)

                await lockedGold.revokeDelegatedGovernanceVotes(
                  delegatee1,
                  toFixed(percentageToRevokeAfterLock / 100)
                )
              })

              it('should revoke votes correctly when delegatee voting', async () => {
                const amountFromDelegator1AfterRevoke =
                  ((2 * delegatedAmount) / percentsToDelegate) *
                  (percentsToDelegate - percentageToRevoke - percentageToRevokeAfterLock)
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount + amountFromDelegator1AfterRevoke // from delegator2 + from delegator1 after revoke
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
                  amountFromDelegator1AfterRevoke,
                  lockedGold
                )
                await assertDelegatorDelegateeAmounts(
                  delegator2,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold // from delegator2
                )
                assertEqualBN(
                  await lockedGold.totalDelegatedCelo(delegatee1),
                  delegatedAmount + amountFromDelegator1AfterRevoke
                )

                await assertEqualBN(
                  await mockGovernance.removeVotesCalledFor(delegatee1),
                  delegatedAmount + amountFromDelegator1AfterRevoke
                )
              })
            })

            describe('When revoking percentage such as that with newly locked amount it would not decrease below zero', () => {
              const percentageToRevokeAfterLock = 2
              const amountRevokedAfterNewLockWitUpdate =
                ((value * 2) / 100) * (percentageToRevoke + percentageToRevokeAfterLock)
              const delegatedAmountAfterLock = ((value * 2) / 100) * percentsToDelegate

              const votingCeloPercent = 100
              const votingAmount =
                ((delegatedAmount * 2 - amountToRevoke) / 100) * votingCeloPercent

              beforeEach(async () => {
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  percentsToDelegate - percentageToRevoke
                )

                await mockGovernance.setTotalVotes(delegatee1, votingAmount)

                await lockedGold.revokeDelegatedGovernanceVotes(
                  delegatee1,
                  toFixed(percentageToRevokeAfterLock / 100)
                )
              })

              it('should revoke votes correctly when delegatee voting', async () => {
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount + (delegatedAmountAfterLock - amountRevokedAfterNewLockWitUpdate)
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
                  delegatedAmountAfterLock - amountRevokedAfterNewLockWitUpdate,
                  lockedGold
                )
                await assertDelegatorDelegateeAmounts(
                  delegator2,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
                assertEqualBN(
                  await lockedGold.totalDelegatedCelo(delegatee1),
                  delegatedAmount + (delegatedAmountAfterLock - amountRevokedAfterNewLockWitUpdate)
                )
                await assertEqualBN(await mockGovernance.removeVotesCalledFor(delegatee1), 0)
              })
            })
          })
        })

        describe('When delegated to 2 accounts', () => {
          const percentageToRevoke = 2
          const amountToRevoke = (value / 100) * percentageToRevoke

          beforeEach(async () => {
            await lockedGold.delegateGovernanceVotes(delegatee2, toFixed(percentsToDelegate / 100))
            await lockedGold.revokeDelegatedGovernanceVotes(
              delegatee1,
              toFixed(percentageToRevoke / 100)
            )
          })

          it('should revoke votes correctly when delegatee not voting (delegated to 2 accounts)', async () => {
            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
              delegatedAmount - amountToRevoke
            )
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee1,
              percentsToDelegate - percentageToRevoke,
              delegatedAmount - amountToRevoke,
              lockedGold
            )

            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2),
              delegatedAmount
            )
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee2,
              percentsToDelegate,
              delegatedAmount,
              lockedGold
            )

            assertEqualBN(
              await lockedGold.totalDelegatedCelo(delegatee1),
              delegatedAmount - amountToRevoke
            )
            assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee2), delegatedAmount)
          })
        })

        describe('When delegatee is voting', () => {
          const votingWeight = 100
          beforeEach(async () => {
            await mockGovernance.setTotalVotes(delegatee1, votingWeight)
          })

          it('should revoke votes correctly when delegatee is voting', async () => {
            const percentageToRevoke = 9
            const amountToRevoke = (value / 100) * percentageToRevoke
            await lockedGold.revokeDelegatedGovernanceVotes(
              delegatee1,
              toFixed(percentageToRevoke / 100)
            )

            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
              delegatedAmount - amountToRevoke
            )
            const [fraction, currentAmount] = await lockedGold.getDelegatorDelegateeInfo(
              delegator,
              delegatee1
            )
            assertEqualBN(
              fromFixed(fraction).multipliedBy(100),
              percentsToDelegate - percentageToRevoke
            )
            assertEqualBN(currentAmount, delegatedAmount - amountToRevoke)

            assertEqualBN(
              await mockGovernance.removeVotesCalledFor(delegatee1),
              delegatedAmount - amountToRevoke
            )
            assertEqualBN(
              await lockedGold.totalDelegatedCelo(delegatee1),
              delegatedAmount - amountToRevoke
            )
          })
        })
      })
    })

    describe('When vote signers', () => {
      describe('When having delegated amount', () => {
        const value = 1000
        const delegator = accounts[0]
        const delegator2 = accounts[1]
        const delegatee1 = accounts[5]
        const delegatee2 = accounts[6]
        let delegatorSigner
        let delegatee1Signer
        let delegator2Signer
        let delegatee2Signer

        const percentsToDelegate = 10
        const delegatedAmount = (value / 100) * percentsToDelegate

        beforeEach(async () => {
          await accountsInstance.createAccount({ from: delegator2 })
          await accountsInstance.createAccount({ from: delegatee1 })
          await accountsInstance.createAccount({ from: delegatee2 })

          await lockedGold.lock({ value: value.toString(), from: delegator })
          await lockedGold.lock({ value: value.toString(), from: delegator2 })
          ;[delegatorSigner, delegatee1Signer] = await createAndAssertDelegatorDelegateeSigners(
            accountsInstance,
            accounts,
            delegator,
            delegatee1
          )
          ;[delegator2Signer, delegatee2Signer] = await createAndAssertDelegatorDelegateeSigners(
            accountsInstance,
            accounts,
            delegator2,
            delegatee2
          )

          await lockedGold.delegateGovernanceVotes(
            delegatee1Signer,
            toFixed(percentsToDelegate / 100),
            {
              from: delegatorSigner,
            }
          )
          assertEqualBN(
            await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
            delegatedAmount
          )
          assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount)
          assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1Signer), 0)
        })

        it('should revert when trying to revert more percent than delegated', async () => {
          await assertTransactionRevertWithReason(
            lockedGold.revokeDelegatedGovernanceVotes(ZERO_ADDRESS, toFixed(100 / 100)),
            'Not enough total delegated percents'
          )
        })

        describe('When revoking from delegatee1', () => {
          const percentageToRevoke = 2
          const amountToRevoke = (value / 100) * percentageToRevoke
          let resp: Truffle.TransactionResponse

          beforeEach(async () => {
            resp = await lockedGold.revokeDelegatedGovernanceVotes(
              delegatee1Signer,
              toFixed(percentageToRevoke / 100),
              { from: delegatorSigner }
            )
          })

          it('should revoke votes correctly when delegatee not voting', async () => {
            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
              delegatedAmount - amountToRevoke
            )
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee1,
              percentsToDelegate - percentageToRevoke,
              delegatedAmount - amountToRevoke,
              lockedGold
            )

            assertEqualBN(
              await lockedGold.totalDelegatedCelo(delegatee1),
              delegatedAmount - amountToRevoke
            )

            assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee1Signer), 0)
          })

          it('should emit the DelegatedCeloRevoked event', async () => {
            assert.equal(resp.logs.length, 1)
            const log = resp.logs[0]
            assertLogMatches2(log, {
              event: 'DelegatedCeloRevoked',
              args: {
                delegator,
                delegatee: delegatee1,
                percent: toFixed(percentageToRevoke / 100),
                amount: amountToRevoke,
              },
            })
          })

          describe('When delegator1 locked more gold + delegator2 also delegated to delegatee1', () => {
            beforeEach(async () => {
              assertEqualBN(
                await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                delegatedAmount - amountToRevoke
              )
              await lockedGold.delegateGovernanceVotes(
                delegatee1Signer,
                toFixed(percentsToDelegate / 100),
                {
                  from: delegator2Signer,
                }
              )
              assertEqualBN(
                await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                delegatedAmount + (delegatedAmount - amountToRevoke)
              )
              await lockedGold.lock({ value: value.toString(), from: delegator })
            })

            describe('When revoking percentage such as that with newly locked amount it would decrease below zero', () => {
              const percentageToRevokeAfterLock = 6
              const votingCeloPercent = 100
              const votingAmount =
                ((delegatedAmount * 2 - amountToRevoke) / 100) * votingCeloPercent

              beforeEach(async () => {
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  percentsToDelegate - percentageToRevoke
                )
                await mockGovernance.setTotalVotes(delegatee1, votingAmount)

                await lockedGold.revokeDelegatedGovernanceVotes(
                  delegatee1,
                  toFixed(percentageToRevokeAfterLock / 100)
                )
              })

              it('should revoke votes correctly when delegatee voting', async () => {
                const amountFromDelegator1AfterRevoke =
                  ((2 * delegatedAmount) / percentsToDelegate) *
                  (percentsToDelegate - percentageToRevoke - percentageToRevokeAfterLock)
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount + amountFromDelegator1AfterRevoke // from delegator2 + from delegator1 after revoke
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
                  amountFromDelegator1AfterRevoke,
                  lockedGold
                )
                await assertDelegatorDelegateeAmounts(
                  delegator2,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold // from delegator2
                )
                assertEqualBN(
                  await lockedGold.totalDelegatedCelo(delegatee1),
                  delegatedAmount + amountFromDelegator1AfterRevoke
                )

                await assertEqualBN(
                  await mockGovernance.removeVotesCalledFor(delegatee1),
                  delegatedAmount + amountFromDelegator1AfterRevoke
                )
              })
            })

            describe('When revoking percentage such as that with newly locked amount it would not decrease below zero', () => {
              const percentageToRevokeAfterLock = 2
              const amountRevokedAfterNewLockWitUpdate =
                ((value * 2) / 100) * (percentageToRevoke + percentageToRevokeAfterLock)
              const delegatedAmountAfterLock = ((value * 2) / 100) * percentsToDelegate

              const votingCeloPercent = 100
              const votingAmount =
                ((delegatedAmount * 2 - amountToRevoke) / 100) * votingCeloPercent

              beforeEach(async () => {
                assertEqualBN(
                  fromFixed(
                    await lockedGold.getAccountTotalDelegatedFraction(delegator)
                  ).multipliedBy(100),
                  percentsToDelegate - percentageToRevoke
                )

                await mockGovernance.setTotalVotes(delegatee1, votingAmount)

                await lockedGold.revokeDelegatedGovernanceVotes(
                  delegatee1,
                  toFixed(percentageToRevokeAfterLock / 100)
                )
              })

              it('should revoke votes correctly when delegatee voting', async () => {
                assertEqualBN(
                  await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
                  delegatedAmount + (delegatedAmountAfterLock - amountRevokedAfterNewLockWitUpdate)
                )
                await assertDelegatorDelegateeAmounts(
                  delegator,
                  delegatee1,
                  percentsToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
                  delegatedAmountAfterLock - amountRevokedAfterNewLockWitUpdate,
                  lockedGold
                )
                await assertDelegatorDelegateeAmounts(
                  delegator2,
                  delegatee1,
                  percentsToDelegate,
                  delegatedAmount,
                  lockedGold
                )
                assertEqualBN(
                  await lockedGold.totalDelegatedCelo(delegatee1),
                  delegatedAmount + (delegatedAmountAfterLock - amountRevokedAfterNewLockWitUpdate)
                )
                await assertEqualBN(await mockGovernance.removeVotesCalledFor(delegatee1), 0)
              })
            })
          })
        })

        describe('When delegated to 2 accounts', () => {
          const percentageToRevoke = 2
          const amountToRevoke = (value / 100) * percentageToRevoke

          beforeEach(async () => {
            await lockedGold.delegateGovernanceVotes(
              delegatee2Signer,
              toFixed(percentsToDelegate / 100),
              {
                from: delegatorSigner,
              }
            )
            await lockedGold.revokeDelegatedGovernanceVotes(
              delegatee1Signer,
              toFixed(percentageToRevoke / 100),
              {
                from: delegatorSigner,
              }
            )
          })

          it('should revoke votes correctly when delegatee not voting (delegated to 2 accounts)', async () => {
            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
              delegatedAmount - amountToRevoke
            )
            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1Signer),
              0
            )
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee1,
              percentsToDelegate - percentageToRevoke,
              delegatedAmount - amountToRevoke,
              lockedGold
            )

            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2),
              delegatedAmount
            )
            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee2Signer),
              0
            )
            await assertDelegatorDelegateeAmounts(
              delegator,
              delegatee2,
              percentsToDelegate,
              delegatedAmount,
              lockedGold
            )

            assertEqualBN(
              await lockedGold.totalDelegatedCelo(delegatee1),
              delegatedAmount - amountToRevoke
            )
            assertEqualBN(await lockedGold.totalDelegatedCelo(delegatee2), delegatedAmount)
          })
        })

        describe('When delegatee is voting', () => {
          const votingWeight = 100
          beforeEach(async () => {
            await mockGovernance.setTotalVotes(delegatee1, votingWeight)
          })

          it('should revoke votes correctly when delegatee is voting', async () => {
            const percentageToRevoke = 9
            const amountToRevoke = (value / 100) * percentageToRevoke
            await lockedGold.revokeDelegatedGovernanceVotes(
              delegatee1Signer,
              toFixed(percentageToRevoke / 100),
              {
                from: delegatorSigner,
              }
            )

            assertEqualBN(
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
              delegatedAmount - amountToRevoke
            )
            const [fraction, currentAmount] = await lockedGold.getDelegatorDelegateeInfo(
              delegator,
              delegatee1
            )
            assertEqualBN(
              fromFixed(fraction).multipliedBy(100),
              percentsToDelegate - percentageToRevoke
            )
            assertEqualBN(currentAmount, delegatedAmount - amountToRevoke)

            assertEqualBN(
              await mockGovernance.removeVotesCalledFor(delegatee1),
              delegatedAmount - amountToRevoke
            )
            assertEqualBN(
              await lockedGold.totalDelegatedCelo(delegatee1),
              delegatedAmount - amountToRevoke
            )
          })
        })
      })
    })
  })

  describe('#getAccountTotalGovernanceVotingPower()', () => {
    const delegatee = accounts[5]
    const delegator = accounts[6]
    const value = 1000
    it('should return 0 when nothing locked nor account', async () => {
      const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
      assertEqualBN(votingPower, 0)
    })

    describe('When having accounts', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount({ from: delegatee })
        await accountsInstance.createAccount({ from: delegator })
        await lockedGold.lock({ value: value.toString(), from: delegator })
      })

      describe('When only delegated', () => {
        const delegatedPercent = 70
        const delegatedAmount = (value / 100) * delegatedPercent

        beforeEach(async () => {
          await lockedGold.delegateGovernanceVotes(delegatee, toFixed(delegatedPercent / 100), {
            from: delegator,
          })
        })

        it('should return correct value when locked and delegated (delegatee)', async () => {
          const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
          assertEqualBN(votingPower, delegatedAmount)
        })

        it('should return correct value when locked and delegated (delegator)', async () => {
          const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegator)
          assertEqualBN(votingPower, value - delegatedAmount)
        })
      })

      describe('When delegatee has locked celo', () => {
        beforeEach(async () => {
          await lockedGold.lock({ value: value.toString(), from: delegatee })
        })

        it('should return correct value when locked', async () => {
          const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
          assertEqualBN(votingPower, value)
        })

        describe('When delegating', () => {
          const delegatedPercent = 70
          const delegatedAmount = (value / 100) * delegatedPercent

          beforeEach(async () => {
            await lockedGold.delegateGovernanceVotes(delegatee, toFixed(delegatedPercent / 100), {
              from: delegator,
            })
          })

          it('should return correct value when locked and delegated (delegatee)', async () => {
            const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
            assertEqualBN(votingPower, value + delegatedAmount)
          })

          it('should return correct value when locked and delegated (delegator)', async () => {
            const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegator)
            assertEqualBN(votingPower, value - delegatedAmount)
          })
        })
      })
    })
  })

  describe('#getDelegatorDelegateeInfo()', () => {
    const delegatee = accounts[5]
    const delegator = accounts[6]

    it('should return 0 when nothing delegated', async () => {
      const [fraction, delegatedAmount] = await lockedGold.getDelegatorDelegateeInfo(
        delegatee,
        delegator
      )
      assertEqualBN(fromFixed(fraction).multipliedBy(100), 0)
      assertEqualBN(delegatedAmount, 0)
    })

    describe('When locked celo', () => {
      const value = 1000
      const delegatedPercent = 70
      const delegatedAmount = (value / 100) * delegatedPercent

      beforeEach(async () => {
        await accountsInstance.createAccount({ from: delegatee })
        await accountsInstance.createAccount({ from: delegator })

        await lockedGold.lock({ value: value.toString(), from: delegatee })
        await lockedGold.lock({ value: value.toString(), from: delegator })

        await lockedGold.delegateGovernanceVotes(delegatee, toFixed(delegatedPercent / 100), {
          from: delegator,
        })
      })

      it('should return correct percent and amount', async () => {
        const [fraction, amount] = await lockedGold.getDelegatorDelegateeInfo(delegator, delegatee)
        assertEqualBN(fromFixed(fraction).multipliedBy(100), delegatedPercent)
        assertEqualBN(amount, delegatedAmount)
      })
    })
  })

  describe('#getDelegatorDelegateeExpectedAndRealAmount()', () => {
    const delegatee = accounts[5]
    const delegator = accounts[6]

    beforeEach(async () => {
      await accountsInstance.createAccount({ from: delegatee })
      await accountsInstance.createAccount({ from: delegator })
    })

    it('should return 0 when nothing delegated', async () => {
      const [expected, actual] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
        delegator,
        delegatee
      )
      assertEqualBN(expected, 0)
      assertEqualBN(actual, 0)
    })

    describe('When delegated', () => {
      const value = 1000
      const delegatedPercent = 70
      const delegatedAmount = (value / 100) * delegatedPercent

      beforeEach(async () => {
        await lockedGold.lock({ value: value.toString(), from: delegator })
        await lockedGold.delegateGovernanceVotes(delegatee, toFixed(delegatedPercent / 100), {
          from: delegator,
        })
      })

      it('should return equal amounts', async () => {
        const [expected, actual] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
          delegator,
          delegatee
        )
        assertEqualBN(expected, delegatedAmount)
        assertEqualBN(actual, delegatedAmount)
      })

      describe('When locked more celo', () => {
        const updatedDelegatedAmount = ((value * 2) / 100) * delegatedPercent
        beforeEach(async () => {
          await lockedGold.lock({ value: value.toString(), from: delegator })
        })

        it('should return equal amounts', async () => {
          const [expected, actual] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            delegator,
            delegatee
          )
          assertEqualBN(expected, updatedDelegatedAmount)
          assertEqualBN(actual, updatedDelegatedAmount)
        })

        it('should update total voting power of delegatee', async () => {
          const totalAccountGovernanceVotingPower =
            await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
          assertEqualBN(totalAccountGovernanceVotingPower, delegatedAmount * 2)
        })
      })
    })

    describe('When having vote signer', () => {
      let delegateeSigner
      let delegatorSigner

      beforeEach(async () => {
        ;[delegatorSigner, delegateeSigner] = await createAndAssertDelegatorDelegateeSigners(
          accountsInstance,
          accounts,
          delegator,
          delegatee
        )
      })

      describe('When delegated', () => {
        const value = 1000
        const delegatedPercent = 70
        const delegatedAmount = (value / 100) * delegatedPercent

        beforeEach(async () => {
          await lockedGold.lock({ value: value.toString(), from: delegator })
          await lockedGold.delegateGovernanceVotes(
            delegateeSigner,
            toFixed(delegatedPercent / 100),
            {
              from: delegatorSigner,
            }
          )
        })

        it('should return equal amounts', async () => {
          const [expectedSigner, actualSigner] =
            await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
              delegatorSigner,
              delegateeSigner
            )

          const [expected, actual] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
            delegator,
            delegatee
          )

          assertEqualBN(expected, delegatedAmount)
          assertEqualBN(actual, delegatedAmount)
          assertEqualBN(expectedSigner, delegatedAmount)
          assertEqualBN(actualSigner, delegatedAmount)
        })

        describe('When locked more celo', () => {
          const updatedDelegatedAmount = ((value * 2) / 100) * delegatedPercent
          beforeEach(async () => {
            await lockedGold.lock({ value: value.toString(), from: delegator })
          })

          it('should return equal amounts', async () => {
            const [expectedSigner, actualSigner] =
              await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
                delegatorSigner,
                delegateeSigner
              )

            const [expected, actual] = await lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
              delegator,
              delegatee
            )

            assertEqualBN(expected, updatedDelegatedAmount)
            assertEqualBN(actual, updatedDelegatedAmount)
            assertEqualBN(expectedSigner, updatedDelegatedAmount)
            assertEqualBN(actualSigner, updatedDelegatedAmount)
          })

          it('should update total voting power of delegatee', async () => {
            const totalAccountGovernanceVotingPower =
              await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)

            const totalAccountGovernanceVotingPowerSigner =
              await lockedGold.getAccountTotalGovernanceVotingPower(delegateeSigner)

            assertEqualBN(totalAccountGovernanceVotingPowerSigner, 0)
            assertEqualBN(totalAccountGovernanceVotingPower, delegatedAmount * 2)
          })
        })
      })
    })
  })

  describe('#updateDelegatedAmount()', () => {
    const delegatee = accounts[5]
    const delegator = accounts[6]

    const value = 1000
    const delegatedPercent = 70
    const delegatedAmount = (value / 100) * delegatedPercent

    beforeEach(async () => {
      await accountsInstance.createAccount({ from: delegatee })
      await accountsInstance.createAccount({ from: delegator })
      await lockedGold.lock({ value: value.toString(), from: delegator })
    })

    describe('When no vote signer', () => {
      beforeEach(async () => {
        await lockedGold.delegateGovernanceVotes(delegatee, toFixed(delegatedPercent / 100), {
          from: delegator,
        })
      })

      it('should return correct value when locked and delegated (delegatee)', async () => {
        const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
        assertEqualBN(votingPower, delegatedAmount)
        await assertDelegatorDelegateeAmounts(
          delegator,
          delegatee,
          delegatedPercent,
          delegatedAmount,
          lockedGold
        )
      })

      describe('When delegator locked more celo', () => {
        beforeEach(async () => {
          await lockedGold.lock({ value: value.toString(), from: delegator })
          await lockedGold.updateDelegatedAmount(delegator, delegatee)
        })

        it('should return correct value when locked and delegated (delegatee)', async () => {
          const totalDelegatorLockedGold = await lockedGold.getAccountTotalLockedGold(delegator)
          assertEqualBN(totalDelegatorLockedGold, value * 2)

          const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
          assertEqualBN(votingPower, delegatedAmount * 2)
          await assertDelegatorDelegateeAmounts(
            delegator,
            delegatee,
            delegatedPercent,
            delegatedAmount * 2,
            lockedGold
          )
        })
      })
    })

    describe('When vote signer', () => {
      let delegateeSigner
      let delegatorSigner

      beforeEach(async () => {
        ;[delegatorSigner, delegateeSigner] = await createAndAssertDelegatorDelegateeSigners(
          accountsInstance,
          accounts,
          delegator,
          delegatee
        )
        await lockedGold.delegateGovernanceVotes(delegateeSigner, toFixed(delegatedPercent / 100), {
          from: delegatorSigner,
        })
      })

      it('should return correct value when locked and delegated (delegatee)', async () => {
        const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
        assertEqualBN(votingPower, delegatedAmount)
        await assertDelegatorDelegateeAmounts(
          delegator,
          delegatee,
          delegatedPercent,
          delegatedAmount,
          lockedGold
        )
      })

      describe('When delegator locked more celo', () => {
        beforeEach(async () => {
          await lockedGold.lock({ value: value.toString(), from: delegator })
          await lockedGold.updateDelegatedAmount(delegatorSigner, delegateeSigner)
        })

        it('should return correct value when locked and delegated (delegatee)', async () => {
          const totalDelegatorLockedGold = await lockedGold.getAccountTotalLockedGold(delegator)
          assertEqualBN(totalDelegatorLockedGold, value * 2)

          const votingPower = await lockedGold.getAccountTotalGovernanceVotingPower(delegatee)
          assertEqualBN(votingPower, delegatedAmount * 2)
          await assertDelegatorDelegateeAmounts(
            delegator,
            delegatee,
            delegatedPercent,
            delegatedAmount * 2,
            lockedGold
          )
        })
      })
    })
  })

  describe('#getTotalPendingWithdrawalsCount()', () => {
    it('should return 0 if account has no pending withdrawals', async () => {
      const count = await lockedGold.getTotalPendingWithdrawalsCount(account)
      assert.equal(count.toNumber(), 0)
    })

    it('should return the count of pending withdrawals', async () => {
      const value = 10000
      // @ts-ignore
      await lockedGold.lock({ value })
      await lockedGold.unlock(value / 2)
      await lockedGold.unlock(value / 2)

      const count = await lockedGold.getTotalPendingWithdrawalsCount(account)
      assert.equal(count.toNumber(), 2)
    })

    it('should return 0 for a non-existent account', async () => {
      const nonExistentAccount = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
      const count = await lockedGold.getTotalPendingWithdrawalsCount(nonExistentAccount)
      assert.equal(count.toNumber(), 0)
    })
  })
})
