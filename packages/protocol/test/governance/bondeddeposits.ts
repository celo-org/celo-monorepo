import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches,
  assertRevert,
  NULL_ADDRESS,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  LockedGoldContract,
  LockedGoldInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
  MockGovernanceContract,
  MockGovernanceInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const LockedGold: LockedGoldContract = artifacts.require('LockedGold')
const Registry: RegistryContract = artifacts.require('Registry')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')
const MockGovernance: MockGovernanceContract = artifacts.require('MockGovernance')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'

const HOUR = 60 * 60
const DAY = 24 * HOUR
const YEAR = 365 * DAY

// TODO(asa): Test reward redemption
contract('LockedGold', (accounts: string[]) => {
  let account = accounts[0]
  const nonOwner = accounts[1]
  const maxNoticePeriod = 2 * YEAR
  let mockGoldToken: MockGoldTokenInstance
  let mockGovernance: MockGovernanceInstance
  let mockValidators: MockValidatorsInstance
  let lockedGold: LockedGoldInstance
  let registry: RegistryInstance

  const getParsedSignatureOfAddress = async (address: string, signer: string) => {
    // @ts-ignore
    const hash = web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }

  enum roles {
    validating,
    voting,
    rewards,
  }
  const forEachRole = (tests: (arg0: roles) => void) =>
    Object.keys(roles)
      .slice(3)
      .map((role) => describe(`when dealing with ${role} role`, () => tests(roles[role])))

  beforeEach(async () => {
    lockedGold = await LockedGold.new()
    mockGoldToken = await MockGoldToken.new()
    mockGovernance = await MockGovernance.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
    await registry.setAddressFor(CeloContractName.Governance, mockGovernance.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await lockedGold.initialize(registry.address, maxNoticePeriod)
    await lockedGold.createAccount()
  })

  describe('#isAccount()', () => {
    it('created account should exist', async () => {
      const b = await lockedGold.isAccount(account)
      assert.equal(b, true)
    })
    it('account that was not created should not exist', async () => {
      const b = await lockedGold.isAccount(accounts[2])
      assert.equal(b, false)
    })
  })

  describe('#isDelegate()', () => {
    const delegate = accounts[1]

    beforeEach(async () => {
      const sig = await getParsedSignatureOfAddress(account, delegate)
      await lockedGold.delegateRole(roles.voting, delegate, sig.v, sig.r, sig.s)
    })

    it('should return true for delegate', async () => {
      assert.equal(await lockedGold.isDelegate(delegate), true)
    })
    it('should return false for account', async () => {
      assert.equal(await lockedGold.isDelegate(account), false)
    })
    it('should return false for others', async () => {
      assert.equal(await lockedGold.isDelegate(accounts[4]), false)
    })
  })

  describe('#initialize()', () => {
    it('should set the owner', async () => {
      const owner: string = await lockedGold.owner()
      assert.equal(owner, account)
    })

    it('should set the maxNoticePeriod', async () => {
      const actual = await lockedGold.maxNoticePeriod()
      assert.equal(actual.toNumber(), maxNoticePeriod)
    })

    it('should set the registry address', async () => {
      const registryAddress: string = await lockedGold.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should revert if already initialized', async () => {
      await assertRevert(lockedGold.initialize(registry.address, maxNoticePeriod))
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

  describe('#setMaxNoticePeriod()', () => {
    it('should set maxNoticePeriod when called by the owner', async () => {
      await lockedGold.setMaxNoticePeriod(1)
      assert.equal((await lockedGold.maxNoticePeriod()).toNumber(), 1)
    })

    it('should emit a MaxNoticePeriodSet event', async () => {
      const resp = await lockedGold.setMaxNoticePeriod(1)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'MaxNoticePeriodSet', {
        maxNoticePeriod: new BigNumber(1),
      })
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(lockedGold.setMaxNoticePeriod(1, { from: nonOwner }))
    })
  })

  describe('#delegateRole()', () => {
    const delegate = accounts[1]
    let sig

    beforeEach(async () => {
      sig = await getParsedSignatureOfAddress(account, delegate)
    })

    forEachRole((role) => {
      it('should set the role delegate', async () => {
        await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
        assert.equal(await lockedGold.delegations(delegate), account)
        assert.equal(await lockedGold.isDelegate(delegate), true)
        assert.equal(await lockedGold.getDelegateFromAccountAndRole(account, role), delegate)
        assert.equal(await lockedGold.getAccountFromDelegateAndRole(delegate, role), account)
      })

      it('should emit a RoleDelegated event', async () => {
        const resp = await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches(log, 'RoleDelegated', {
          role,
          account,
          delegate,
        })
      })

      it('should revert if the delegate is an account', async () => {
        await lockedGold.createAccount({ from: delegate })
        await assertRevert(lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s))
      })

      it('should revert if the address is already being delegated to', async () => {
        const otherAccount = accounts[2]
        const otherSig = await getParsedSignatureOfAddress(otherAccount, delegate)
        await lockedGold.createAccount({ from: otherAccount })
        await lockedGold.delegateRole(role, delegate, otherSig.v, otherSig.r, otherSig.s, {
          from: otherAccount,
        })
        await assertRevert(lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s))
      })

      it('should revert if the signature is incorrect', async () => {
        const nonDelegate = accounts[3]
        const incorrectSig = await getParsedSignatureOfAddress(account, nonDelegate)
        await assertRevert(
          lockedGold.delegateRole(role, delegate, incorrectSig.v, incorrectSig.r, incorrectSig.s)
        )
      })

      describe('when a previous delegation has been made', async () => {
        const newDelegate = accounts[2]
        let newSig
        beforeEach(async () => {
          await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
          newSig = await getParsedSignatureOfAddress(account, newDelegate)
        })

        it('should set the new delegate', async () => {
          await lockedGold.delegateRole(role, newDelegate, newSig.v, newSig.r, newSig.s)
          assert.equal(await lockedGold.delegations(newDelegate), account)
          assert.equal(await lockedGold.getDelegateFromAccountAndRole(account, role), newDelegate)
          assert.equal(await lockedGold.getAccountFromDelegateAndRole(newDelegate, role), account)
        })

        it('should reset the previous delegate', async () => {
          await lockedGold.delegateRole(role, newDelegate, newSig.v, newSig.r, newSig.s)
          assert.equal(await lockedGold.delegations(delegate), NULL_ADDRESS)
        })
      })
    })
  })

  describe('#freezeVoting()', () => {
    it('should set the account voting to frozen', async () => {
      await lockedGold.freezeVoting()
      assert.isTrue(await lockedGold.isVotingFrozen(account))
    })

    it('should emit a VotingFrozen event', async () => {
      const resp = await lockedGold.freezeVoting()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'VotingFrozen', {
        account,
      })
    })

    it('should revert if the account voting is already frozen', async () => {
      await lockedGold.freezeVoting()
      await assertRevert(lockedGold.freezeVoting())
    })
  })

  describe('#unfreezeVoting()', () => {
    beforeEach(async () => {
      await lockedGold.freezeVoting()
    })

    it('should set the account voting to unfrozen', async () => {
      await lockedGold.unfreezeVoting()
      assert.isFalse(await lockedGold.isVotingFrozen(account))
    })

    it('should emit a VotingUnfrozen event', async () => {
      const resp = await lockedGold.unfreezeVoting()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'VotingUnfrozen', {
        account,
      })
    })

    it('should revert if the account voting is already unfrozen', async () => {
      await lockedGold.unfreezeVoting()
      await assertRevert(lockedGold.unfreezeVoting())
    })
  })

  describe('#newCommitment()', () => {
    const noticePeriod = 1 * DAY + 1 * HOUR
    const value = 1000
    const expectedWeight = 1033

    it('should add a Locked Gold commitment', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
      const noticePeriods = await lockedGold.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 1)
      assert.equal(noticePeriods[0].toNumber(), noticePeriod)
      const [lockedValue, index] = await lockedGold.getLockedCommitment(account, noticePeriod)
      assert.equal(lockedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
      const weight = await lockedGold.getAccountWeight(account)
      assert.equal(weight.toNumber(), expectedWeight)
    })

    it('should update the total weight', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
      const totalWeight = await lockedGold.totalWeight()
      assert.equal(totalWeight.toNumber(), expectedWeight)
    })

    it('should emit a NewCommitment event', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      const resp = await lockedGold.newCommitment(noticePeriod, { value })
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'NewCommitment', {
        account,
        value: new BigNumber(value),
        noticePeriod: new BigNumber(noticePeriod),
      })
    })

    it('should revert when the specified notice period is too large', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await assertRevert(lockedGold.newCommitment(maxNoticePeriod + 1, { value }))
    })

    it('should revert when the specified value is 0', async () => {
      await assertRevert(lockedGold.newCommitment(noticePeriod))
    })

    it('should revert when the account does not exist', async () => {
      await assertRevert(lockedGold.newCommitment(noticePeriod, { value, from: accounts[1] }))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await assertRevert(lockedGold.newCommitment(noticePeriod, { value }))
    })
  })

  describe('#notifyCommitment()', () => {
    const noticePeriod = 60 * 60 * 24 // 1 day
    const value = 1000
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
    })

    it('should add a notified deposit', async () => {
      await lockedGold.notifyCommitment(value, noticePeriod)
      const availabilityTime = new BigNumber(noticePeriod).plus(
        (await web3.eth.getBlock('latest')).timestamp
      )
      const availabilityTimes = await lockedGold.getAvailabilityTimes(account)
      assert.equal(availabilityTimes.length, 1)
      assert.equal(availabilityTimes[0].toNumber(), availabilityTime.toNumber())

      const [notifiedValue, index] = await lockedGold.getNotifiedCommitment(
        account,
        availabilityTime
      )
      assert.equal(notifiedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should remove the Locked Gold commitment', async () => {
      await lockedGold.notifyCommitment(value, noticePeriod)
      const noticePeriods = await lockedGold.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 0)
      const [lockedValue, index] = await lockedGold.getLockedCommitment(account, noticePeriod)
      assert.equal(lockedValue.toNumber(), 0)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      await lockedGold.notifyCommitment(value, noticePeriod)
      const weight = await lockedGold.getAccountWeight(account)
      assert.equal(weight.toNumber(), value)
    })

    it('should update the total weight', async () => {
      await lockedGold.notifyCommitment(value, noticePeriod)
      const totalWeight = await lockedGold.totalWeight()
      assert.equal(totalWeight.toNumber(), value)
    })

    it('should emit a CommitmentNotified event', async () => {
      const resp = await lockedGold.notifyCommitment(value, noticePeriod)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'CommitmentNotified', {
        account,
        value: new BigNumber(value),
        noticePeriod: new BigNumber(noticePeriod),
        availabilityTime: new BigNumber(noticePeriod).plus(
          (await web3.eth.getBlock('latest')).timestamp
        ),
      })
    })

    it('should revert when the value of the Locked Gold commitment is 0', async () => {
      await assertRevert(lockedGold.notifyCommitment(1, noticePeriod + 1))
    })

    it('should revert when value is greater than the value of the Locked Gold commitment', async () => {
      await assertRevert(lockedGold.notifyCommitment(value + 1, noticePeriod))
    })

    it('should revert when the value is 0', async () => {
      await assertRevert(lockedGold.notifyCommitment(0, noticePeriod))
    })

    it('should revert if the account is validating', async () => {
      await mockValidators.setValidating(account)
      await assertRevert(lockedGold.notifyCommitment(value, noticePeriod))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(lockedGold.notifyCommitment(value, noticePeriod))
    })
  })

  describe('#extendCommitment()', () => {
    const value = 1000
    const expectedWeight = 1033
    let availabilityTime: BigNumber

    beforeEach(async () => {
      // Set an initial notice period of just over one day, so that when we rebond, we're
      // guaranteed that the new notice period is at least one day.
      const noticePeriod = 1 * DAY + 1 * HOUR
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
      await lockedGold.notifyCommitment(value, noticePeriod)
      availabilityTime = new BigNumber(noticePeriod).plus(
        (await web3.eth.getBlock('latest')).timestamp
      )
    })

    it('should add a Locked Gold commitment', async () => {
      await lockedGold.extendCommitment(value, availabilityTime)
      const noticePeriods = await lockedGold.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 1)
      const noticePeriod = availabilityTime
        .minus((await web3.eth.getBlock('latest')).timestamp)
        .toNumber()
      assert.equal(noticePeriods[0].toNumber(), noticePeriod)
      const [lockedValue, index] = await lockedGold.getLockedCommitment(account, noticePeriod)
      assert.equal(lockedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should remove a notified deposit', async () => {
      await lockedGold.extendCommitment(value, availabilityTime)
      const availabilityTimes = await lockedGold.getAvailabilityTimes(account)
      assert.equal(availabilityTimes.length, 0)
      const [notifiedValue, index] = await lockedGold.getNotifiedCommitment(
        account,
        availabilityTime
      )
      assert.equal(notifiedValue.toNumber(), 0)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      await lockedGold.extendCommitment(value, availabilityTime)
      const weight = await lockedGold.getAccountWeight(account)
      assert.equal(weight.toNumber(), expectedWeight)
    })

    it('should update the total weight', async () => {
      await lockedGold.extendCommitment(value, availabilityTime)
      const totalWeight = await lockedGold.totalWeight()
      assert.equal(totalWeight.toNumber(), expectedWeight)
    })

    it('should emit a CommitmentExtended event', async () => {
      const resp = await lockedGold.extendCommitment(value, availabilityTime)
      const noticePeriod = availabilityTime.minus((await web3.eth.getBlock('latest')).timestamp)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'CommitmentExtended', {
        account,
        value: new BigNumber(value),
        noticePeriod,
        availabilityTime,
      })
    })

    it('should revert when the notified deposit is withdrawable', async () => {
      await timeTravel(
        availabilityTime
          .minus((await web3.eth.getBlock('latest')).timestamp)
          .plus(1)
          .toNumber(),
        web3
      )
      await assertRevert(lockedGold.extendCommitment(value, availabilityTime))
    })

    it('should revert when the value of the notified deposit is 0', async () => {
      await assertRevert(lockedGold.extendCommitment(value, availabilityTime.plus(1)))
    })

    it('should revert when the value is 0', async () => {
      await assertRevert(lockedGold.extendCommitment(0, availabilityTime))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(lockedGold.extendCommitment(value, availabilityTime))
    })
  })

  describe('#withdrawCommitment()', () => {
    const noticePeriod = 1 * DAY
    const value = 1000
    let availabilityTime: BigNumber

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
      await lockedGold.notifyCommitment(value, noticePeriod)
      availabilityTime = new BigNumber(noticePeriod).plus(
        (await web3.eth.getBlock('latest')).timestamp
      )
    })

    it('should remove the notified deposit', async () => {
      await timeTravel(noticePeriod, web3)
      await lockedGold.withdrawCommitment(availabilityTime)

      const availabilityTimes = await lockedGold.getAvailabilityTimes(account)
      assert.equal(availabilityTimes.length, 0)
    })

    it('should update the account weight', async () => {
      await timeTravel(noticePeriod, web3)
      await lockedGold.withdrawCommitment(availabilityTime)

      const weight = await lockedGold.getAccountWeight(account)
      assert.equal(weight.toNumber(), 0)
    })

    it('should update the total weight', async () => {
      await timeTravel(noticePeriod, web3)
      await lockedGold.withdrawCommitment(availabilityTime)

      const totalWeight = await lockedGold.totalWeight()
      assert.equal(totalWeight.toNumber(), 0)
    })

    it('should emit a Withdrawal event', async () => {
      await timeTravel(noticePeriod, web3)
      const resp = await lockedGold.withdrawCommitment(availabilityTime)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'Withdrawal', {
        account,
        value: new BigNumber(value),
      })
    })

    it('should revert if the account is validating', async () => {
      await mockValidators.setValidating(account)
      await assertRevert(lockedGold.withdrawCommitment(availabilityTime))
    })

    it('should revert when the notice period has not passed', async () => {
      await assertRevert(lockedGold.withdrawCommitment(availabilityTime))
    })

    it('should revert when the value of the notified deposit is 0', async () => {
      await timeTravel(noticePeriod, web3)
      await assertRevert(lockedGold.withdrawCommitment(availabilityTime.plus(1)))
    })

    it('should revert if the caller is voting', async () => {
      await timeTravel(noticePeriod, web3)
      await mockGovernance.setVoting(account)
      await assertRevert(lockedGold.withdrawCommitment(availabilityTime))
    })
  })

  describe('#increaseNoticePeriod()', () => {
    const noticePeriod = 1 * DAY
    const value = 1000
    const increase = noticePeriod
    const expectedWeight = 1047

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.newCommitment(noticePeriod, { value })
    })

    it('should update the Locked Gold commitment', async () => {
      await lockedGold.increaseNoticePeriod(value, noticePeriod, increase)
      const noticePeriods = await lockedGold.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 1)
      assert.equal(noticePeriods[0].toNumber(), noticePeriod + increase)
      const [lockedValue, index] = await lockedGold.getLockedCommitment(
        account,
        noticePeriod + increase
      )
      assert.equal(lockedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      await lockedGold.increaseNoticePeriod(value, noticePeriod, increase)
      const weight = await lockedGold.getAccountWeight(account)
      assert.equal(weight.toNumber(), expectedWeight)
    })

    it('should update the total weight', async () => {
      await lockedGold.increaseNoticePeriod(value, noticePeriod, increase)
      const totalWeight = await lockedGold.totalWeight()
      assert.equal(totalWeight.toNumber(), expectedWeight)
    })

    it('should emit a NoticePeriodIncreased event', async () => {
      const resp = await lockedGold.increaseNoticePeriod(value, noticePeriod, increase)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'NoticePeriodIncreased', {
        account,
        value: new BigNumber(value),
        noticePeriod: new BigNumber(noticePeriod),
        increase: new BigNumber(increase),
      })
    })

    it('should revert if the value is 0', async () => {
      await assertRevert(lockedGold.increaseNoticePeriod(0, noticePeriod, increase))
    })

    it('should revert if the increase is 0', async () => {
      await assertRevert(lockedGold.increaseNoticePeriod(value, noticePeriod, 0))
    })

    it('should revert if the Locked Gold commitment is smaller than the value', async () => {
      await assertRevert(lockedGold.increaseNoticePeriod(value, noticePeriod + 1, increase))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(lockedGold.increaseNoticePeriod(value, noticePeriod, increase))
    })
  })

  describe('#getAccountFromDelegateAndRole()', () => {
    forEachRole((role) => {
      describe('when the account is not delegating', () => {
        it('should return the account when passed the account', async () => {
          assert.equal(await lockedGold.getAccountFromDelegateAndRole(account, role), account)
        })

        it('should revert when passed a delegate that is not the role delegate', async () => {
          const delegate = accounts[2]
          const diffRole = (role + 1) % 3
          const sig = await getParsedSignatureOfAddress(account, delegate)
          await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
          await assertRevert(lockedGold.getAccountFromDelegateAndRole(delegate, diffRole))
        })
      })

      describe('when the account is delegating', () => {
        const delegate = accounts[1]

        beforeEach(async () => {
          const sig = await getParsedSignatureOfAddress(account, delegate)
          await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
        })

        it('should return the account when passed the delegate', async () => {
          assert.equal(await lockedGold.getAccountFromDelegateAndRole(delegate, role), account)
        })

        it('should return the account when passed the account', async () => {
          assert.equal(await lockedGold.getAccountFromDelegateAndRole(account, role), account)
        })

        it('should revert when passed a delegate that is not the role delegate', async () => {
          const delegate = accounts[2]
          const diffRole = (role + 1) % 3
          const sig = await getParsedSignatureOfAddress(account, delegate)
          await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
          await assertRevert(lockedGold.getAccountFromDelegateAndRole(delegate, diffRole))
        })
      })
    })
  })

  describe('#getDelegateFromAccountAndRole()', () => {
    forEachRole((role) => {
      describe('when the account is not delegating', () => {
        it('should return the account when passed the account', async () => {
          assert.equal(await lockedGold.getDelegateFromAccountAndRole(account, role), account)
        })
      })

      describe('when the account is delegating', () => {
        const delegate = accounts[1]

        beforeEach(async () => {
          const sig = await getParsedSignatureOfAddress(account, delegate)
          await lockedGold.delegateRole(role, delegate, sig.v, sig.r, sig.s)
        })

        it('should return the account when passed undelegated role', async () => {
          const role2 = (role + 1) % 3
          assert.equal(await lockedGold.getDelegateFromAccountAndRole(account, role2), account)
        })

        it('should return the delegate when passed the delegated role', async () => {
          assert.equal(await lockedGold.getDelegateFromAccountAndRole(account, role), delegate)
        })
      })
    })
  })

  describe('#isVoting()', () => {
    describe('when the account is not delegating', () => {
      it('should return false if the account is not voting in governance or validator elections', async () => {
        assert.isFalse(await lockedGold.isVoting(account))
      })

      it('should return true if the account is voting in governance', async () => {
        await mockGovernance.setVoting(account)
        assert.isTrue(await lockedGold.isVoting(account))
      })

      it('should return true if the account is voting in validator elections', async () => {
        await mockValidators.setVoting(account)
        assert.isTrue(await lockedGold.isVoting(account))
      })

      it('should return true if the account is voting in governance and validator elections', async () => {
        await mockGovernance.setVoting(account)
        await mockValidators.setVoting(account)
        assert.isTrue(await lockedGold.isVoting(account))
      })
    })

    describe('when the account is delegating', () => {
      const delegate = accounts[1]

      beforeEach(async () => {
        const sig = await getParsedSignatureOfAddress(account, delegate)
        await lockedGold.delegateRole(roles.voting, delegate, sig.v, sig.r, sig.s)
      })

      it('should return false if the delegate is not voting in governance or validator elections', async () => {
        assert.isFalse(await lockedGold.isVoting(account))
      })

      it('should return true if the delegate is voting in governance', async () => {
        await mockGovernance.setVoting(delegate)
        assert.isTrue(await lockedGold.isVoting(account))
      })

      it('should return true if the delegate is voting in validator elections', async () => {
        await mockValidators.setVoting(delegate)
        assert.isTrue(await lockedGold.isVoting(account))
      })

      it('should return true if the delegate is voting in governance and validator elections', async () => {
        await mockGovernance.setVoting(delegate)
        await mockValidators.setVoting(delegate)
        assert.isTrue(await lockedGold.isVoting(account))
      })
    })
  })

  describe('#getCommitmentWeight()', () => {
    const value = new BigNumber(521000)
    const oneDay = new BigNumber(DAY)
    it('should return the commitment value when notice period is zero', async () => {
      const noticePeriod = new BigNumber(0)
      assertEqualBN(await lockedGold.getCommitmentWeight(value, noticePeriod), value)
    })

    it('should return the commitment value when notice period is less than one day', async () => {
      const noticePeriod = oneDay.minus(1)
      assertEqualBN(await lockedGold.getCommitmentWeight(value, noticePeriod), value)
    })

    it('should return the commitment value times 1.0333 when notice period is one day', async () => {
      const noticePeriod = oneDay
      assertEqualBN(
        await lockedGold.getCommitmentWeight(value, noticePeriod),
        value.times(1.0333).integerValue(BigNumber.ROUND_DOWN)
      )
    })

    it('should return the commitment value times 1.047 when notice period is two days', async () => {
      const noticePeriod = oneDay.times(2)
      assertEqualBN(
        await lockedGold.getCommitmentWeight(value, noticePeriod),
        value.times(1.047).integerValue(BigNumber.ROUND_DOWN)
      )
    })

    it('should return the commitment value times 1.1823 when notice period is 30 days', async () => {
      const noticePeriod = oneDay.times(30)
      assertEqualBN(
        await lockedGold.getCommitmentWeight(value, noticePeriod),
        value.times(1.1823).integerValue(BigNumber.ROUND_DOWN)
      )
    })

    it('should return the commitment value times 2.103 when notice period is 3 years', async () => {
      const noticePeriod = oneDay.times(365).times(3)
      assertEqualBN(
        await lockedGold.getCommitmentWeight(value, noticePeriod),
        value.times(2.103).integerValue(BigNumber.ROUND_DOWN)
      )
    })
  })

  describe('when there are multiple commitments, notifies, rebondings, notice period increases, and withdrawals', () => {
    beforeEach(async () => {
      for (const accountToCreate of accounts) {
        // Account for `account` has already been created.
        if (accountToCreate !== account) {
          await lockedGold.createAccount({ from: accountToCreate })
        }
      }
    })

    enum ActionType {
      Deposit = 'Deposit',
      Notify = 'Notify',
      Increase = 'Increase',
      Rebond = 'Rebond',
      Withdraw = 'Withdraw',
    }

    const initializeState = (numAccounts: number) => {
      const locked: Map<string, Map<string, BigNumber>> = new Map()
      const notified: Map<string, Map<string, BigNumber>> = new Map()
      const noticePeriods: Map<string, Set<string>> = new Map()
      const availabilityTimes: Map<string, Set<string>> = new Map()
      const selectedAccounts = accounts.slice(0, numAccounts)
      for (const acc of selectedAccounts) {
        // Map keys, set elements appear not to be able to be BigNumbers, so we use strings instead.
        locked.set(acc, new Map())
        notified.set(acc, new Map())
        noticePeriods.set(acc, new Set([]))
        availabilityTimes.set(acc, new Set([]))
      }

      return { locked, notified, noticePeriods, availabilityTimes, selectedAccounts }
    }

    const rndElement = <A>(elems: A[]) => {
      return elems[
        Math.floor(
          BigNumber.random()
            .times(elems.length)
            .toNumber()
        )
      ]
    }
    const rndSetElement = (s: Set<string>) => rndElement(Array.from(s))

    const getOrElse = <A, B>(map: Map<B, A>, key: B, defaultValue: A) =>
      map.has(key) ? map.get(key) : defaultValue

    const executeActionsAndAssertState = async (numActions: number, numAccounts: number) => {
      const {
        selectedAccounts,
        locked,
        notified,
        noticePeriods,
        availabilityTimes,
      } = initializeState(numAccounts)

      for (let i = 0; i < numActions; i++) {
        const blockTime = 5
        await timeTravel(blockTime, web3)
        account = rndElement(selectedAccounts)

        const accountLockedGold = locked.get(account)
        const accountNotifiedCommitments = notified.get(account)
        const accountNoticePeriods = noticePeriods.get(account)
        const accountAvailabilityTimes = availabilityTimes.get(account)

        const getWithdrawableAvailabilityTimes = async (): Promise<Set<string>> => {
          const nextTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp)
          const items: string[] = Array.from(accountAvailabilityTimes)
          return new Set(items.filter((x: string) => nextTimestamp.gt(x)))
        }

        const getRebondableAvailabilityTimes = async (): Promise<Set<string>> => {
          const nextTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp).plus(
            blockTime
          )
          const items: string[] = Array.from(accountAvailabilityTimes)
          // Subtract one to cover edge case where block time is 6 seconds.
          return new Set(items.filter((x: string) => nextTimestamp.plus(1).lt(x)))
        }

        // Select random action type.
        const actionTypeOptions = [ActionType.Deposit]
        if (accountNoticePeriods.size > 0) {
          actionTypeOptions.push(ActionType.Notify)
          actionTypeOptions.push(ActionType.Increase)
        }
        const rebondableAvailabilityTimes = await getRebondableAvailabilityTimes()
        if (rebondableAvailabilityTimes.size > 0) {
          // Push twice to increase likelihood
          actionTypeOptions.push(ActionType.Rebond)
          actionTypeOptions.push(ActionType.Rebond)
        }
        const withdrawableAvailabilityTimes = await getWithdrawableAvailabilityTimes()
        if (withdrawableAvailabilityTimes.size > 0) {
          // Push twice to increase likelihood
          actionTypeOptions.push(ActionType.Withdraw)
          actionTypeOptions.push(ActionType.Withdraw)
        }
        const actionType = rndElement(actionTypeOptions)

        const getLockedCommitmentValue = (noticePeriod: string) =>
          getOrElse(accountLockedGold, noticePeriod, new BigNumber(0))
        const getNotifiedCommitmentValue = (availabilityTime: string) =>
          getOrElse(accountNotifiedCommitments, availabilityTime, new BigNumber(0))

        const randomSometimesMaximumValue = (maximum: BigNumber) => {
          assert.isFalse(maximum.eq(0))
          const random = BigNumber.random().toNumber()
          if (random < 0.5) {
            return maximum
          } else {
            return BigNumber.max(
              BigNumber.random()
                .times(maximum)
                .integerValue(),
              1
            )
          }
        }

        // Perform random action and update test implementation state.
        if (actionType === ActionType.Deposit) {
          const value = new BigNumber(web3.utils.randomHex(2)).toNumber()
          // Notice period of at most 10 blocks.
          const noticePeriod = BigNumber.random()
            .times(10)
            .times(blockTime)
            .integerValue()
            .valueOf()
          await lockedGold.newCommitment(noticePeriod, { value, from: account })
          accountNoticePeriods.add(noticePeriod)
          accountLockedGold.set(noticePeriod, getLockedCommitmentValue(noticePeriod).plus(value))
        } else if (actionType === ActionType.Notify || actionType === ActionType.Increase) {
          const noticePeriod = rndSetElement(accountNoticePeriods)
          const lockedDepositValue = getLockedCommitmentValue(noticePeriod)
          const value = randomSometimesMaximumValue(lockedDepositValue)

          if (value.eq(lockedDepositValue)) {
            accountLockedGold.delete(noticePeriod)
            accountNoticePeriods.delete(noticePeriod)
          } else {
            accountLockedGold.set(noticePeriod, lockedDepositValue.minus(value))
          }

          if (actionType === ActionType.Notify) {
            await lockedGold.notifyCommitment(value, noticePeriod, { from: account })
            const availabilityTime = new BigNumber(noticePeriod)
              .plus((await web3.eth.getBlock('latest')).timestamp)
              .valueOf()
            accountAvailabilityTimes.add(availabilityTime)
            accountNotifiedCommitments.set(
              availabilityTime,
              getNotifiedCommitmentValue(availabilityTime).plus(value)
            )
          } else {
            // Notice period increase of at most 10 blocks.
            const increase = BigNumber.random()
              .times(10)
              .times(blockTime)
              .integerValue()
              .plus(1)
            await lockedGold.increaseNoticePeriod(value, noticePeriod, increase, {
              from: account,
            })
            const increasedNoticePeriod = increase.plus(noticePeriod).valueOf()
            accountNoticePeriods.add(increasedNoticePeriod)
            accountLockedGold.set(
              increasedNoticePeriod,
              getLockedCommitmentValue(increasedNoticePeriod).plus(value)
            )
          }
        } else if (actionType === ActionType.Rebond) {
          const availabilityTime = rndSetElement(rebondableAvailabilityTimes)
          const notifiedDepositValue = getNotifiedCommitmentValue(availabilityTime)
          const value = randomSometimesMaximumValue(notifiedDepositValue)
          await lockedGold.extendCommitment(value, availabilityTime, { from: account })

          if (value.eq(notifiedDepositValue)) {
            accountNotifiedCommitments.delete(availabilityTime)
            accountAvailabilityTimes.delete(availabilityTime)
          } else {
            accountNotifiedCommitments.set(availabilityTime, notifiedDepositValue.minus(value))
          }
          const noticePeriod = new BigNumber(availabilityTime)
            .minus((await web3.eth.getBlock('latest')).timestamp)
            .valueOf()
          accountLockedGold.set(noticePeriod, getLockedCommitmentValue(noticePeriod).plus(value))
          accountNoticePeriods.add(noticePeriod)
        } else if (actionType === ActionType.Withdraw) {
          const availabilityTime = rndSetElement(withdrawableAvailabilityTimes)
          await lockedGold.withdrawCommitment(availabilityTime, { from: account })
          accountAvailabilityTimes.delete(availabilityTime)
          accountNotifiedCommitments.delete(availabilityTime)
        } else {
          assert.isTrue(false)
        }

        // Sanity check our test implementation.
        selectedAccounts.forEach((acc) => {
          if (locked.get(acc).size > 0) {
            assert.hasAllKeys(
              noticePeriods.get(acc),
              Array.from(locked.get(acc).keys()),
              `notice periods don\'t match for account: ${acc}`
            )
          }
          if (notified.get(acc).size > 0) {
            assert.hasAllKeys(
              availabilityTimes.get(acc),
              Array.from(notified.get(acc).keys()),
              `availability times don\'t match for account: ${acc}`
            )
          }
        })

        // Test the contract state matches our test implementation.
        let expectedTotalWeight = new BigNumber(0)
        for (const acc of selectedAccounts) {
          let expectedAccountWeight = new BigNumber(0)
          const actualNoticePeriods = await lockedGold.getNoticePeriods(acc)

          assert.lengthOf(actualNoticePeriods, noticePeriods.get(acc).size)
          for (let k = 0; k < actualNoticePeriods.length; k++) {
            const noticePeriod = actualNoticePeriods[k]
            assert.isTrue(noticePeriods.get(acc).has(noticePeriod.valueOf()))
            const [actualValue, actualIndex] = await lockedGold.getLockedCommitment(
              acc,
              noticePeriod
            )
            assertEqualBN(actualIndex, k)
            const expectedValue = locked.get(acc).get(noticePeriod.valueOf())
            assertEqualBN(actualValue, expectedValue)
            assertEqualBN(actualNoticePeriods[actualIndex.toNumber()], noticePeriod)
            expectedAccountWeight = expectedAccountWeight.plus(
              await lockedGold.getCommitmentWeight(expectedValue, noticePeriod)
            )
          }

          const actualAvailabilityTimes = await lockedGold.getAvailabilityTimes(acc)

          assert.equal(actualAvailabilityTimes.length, availabilityTimes.get(acc).size)
          for (let k = 0; k < actualAvailabilityTimes.length; k++) {
            const availabilityTime = actualAvailabilityTimes[k]
            assert.isTrue(availabilityTimes.get(acc).has(availabilityTime.valueOf()))
            const [actualValue, actualIndex] = await lockedGold.getNotifiedCommitment(
              acc,
              availabilityTime
            )
            assertEqualBN(actualIndex, k)
            const expectedValue = notified.get(acc).get(availabilityTime.valueOf())
            assertEqualBN(actualValue, expectedValue)
            assertEqualBN(actualAvailabilityTimes[actualIndex.toNumber()], availabilityTime)
            expectedAccountWeight = expectedAccountWeight.plus(expectedValue)
          }
          assertEqualBN(await lockedGold.getAccountWeight(acc), expectedAccountWeight)
          expectedTotalWeight = expectedTotalWeight.plus(expectedAccountWeight)
        }
      }
    }

    it.skip('should match a simple typescript implementation', async () => {
      const numActions = 100
      const numAccounts = 2
      await executeActionsAndAssertState(numActions, numAccounts)
    })
  })
})
