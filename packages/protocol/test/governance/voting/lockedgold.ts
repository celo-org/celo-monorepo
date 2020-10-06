import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches,
  assertLogMatches2,
  assertRevert,
  NULL_ADDRESS,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  ElectionTestContract,
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
const ElectionTest: ElectionTestContract = artifacts.require('Election')
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
ElectionTest.numberFormat = 'BigNumber'

const HOUR = 60 * 60
const DAY = 24 * HOUR

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
    accountsInstance = await Accounts.new()
    lockedGold = await LockedGold.new()
    mockElection = await MockElection.new()
    mockValidators = await MockValidators.new()
    mockGovernance = await MockGovernance.new()
    registry = await Registry.new()
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
      await assertRevert(lockedGold.initialize(registry.address, unlockingPeriod))
    })
  })

  describe('#setRegistry()', () => {
    const anAddress: string = accounts[2]

    it('should set the registry when called by the owner', async () => {
      await lockedGold.setRegistry(anAddress)
      assert.equal(await lockedGold.registry(), anAddress)
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(lockedGold.setRegistry(anAddress, { from: nonOwner }))
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
      await assertRevert(lockedGold.setUnlockingPeriod(unlockingPeriod))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(lockedGold.setUnlockingPeriod(newUnlockingPeriod, { from: nonOwner }))
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

    it('should revert when the specified value is 0', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await assertRevert(lockedGold.lock({ value: 0 }))
    })

    it('should revert when the account does not exist', async () => {
      await assertRevert(lockedGold.lock({ value, from: accounts[1] }))
    })
  })

  describe('#unlock()', () => {
    const value = 1000
    let availabilityTime: BigNumber
    let resp: any
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

        it('should add a pending withdrawal', async () => {
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
        beforeEach(async () => {
          await mockGovernance.setVoting(account)
        })

        it('should revert', async () => {
          await assertRevert(lockedGold.unlock(value))
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
            await assertRevert(lockedGold.unlock(value))
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
    let resp: any
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
          await assertRevert(lockedGold.relock(index, value))
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(lockedGold.relock(index, pendingWithdrawalValue))
      })
    })
  })

  describe('#withdraw()', () => {
    const value = 1000
    const index = 0
    let resp: any
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
          await assertRevert(lockedGold.withdraw(index))
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(lockedGold.withdraw(index))
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
      await assertRevert(
        lockedGold.addSlasher(CeloContractName.DowntimeSlasher, { from: accounts[1] })
      )
    })
    it('cannot add a slasher twice', async () => {
      await lockedGold.addSlasher(CeloContractName.DowntimeSlasher)
      await assertRevert(lockedGold.addSlasher(CeloContractName.DowntimeSlasher))
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
      await assertRevert(
        lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 0, { from: accounts[1] })
      )
    })
    it('reverts when index too large', async () => {
      await assertRevert(lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 100))
    })
    it('reverts when key does not exists', async () => {
      await assertRevert(lockedGold.removeSlasher(CeloContractName.GovernanceSlasher, 100))
    })
    it('reverts when index and key have mismatch', async () => {
      await lockedGold.addSlasher(CeloContractName.GovernanceSlasher)
      await assertRevert(lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 1))
    })
  })

  describe('#slash', () => {
    const value = 1000
    const group = accounts[1]
    const reporter = accounts[3]

    beforeEach(async () => {
      election = await ElectionTest.new()
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

    describe('when the account is removed from `isSlasher`', () => {
      const penalty = value
      const reward = value / 2
      beforeEach(async () => {
        await lockedGold.removeSlasher(CeloContractName.DowntimeSlasher, 0)
      })

      it('should revert', async () => {
        await assertRevert(
          lockedGold.slash(
            account,
            penalty,
            reporter,
            reward,
            [NULL_ADDRESS],
            [NULL_ADDRESS],
            [0],
            { from: accounts[2] }
          )
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
  })
})
