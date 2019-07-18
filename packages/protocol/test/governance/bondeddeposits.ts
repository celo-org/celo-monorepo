import {
  goldTokenRegistryId,
  governanceRegistryId,
  validatorsRegistryId,
} from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches,
  assertRevert,
  timeTravel,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  BondedDepositsContract,
  BondedDepositsInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
  MockGovernanceContract,
  MockGovernanceInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const BondedDeposits: BondedDepositsContract = artifacts.require('BondedDeposits')
const Registry: RegistryContract = artifacts.require('Registry')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')
const MockGovernance: MockGovernanceContract = artifacts.require('MockGovernance')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')

// @ts-ignore
// TODO(mcortesi): Use BN
BondedDeposits.numberFormat = 'BigNumber'

// TODO(asa): Test reward redemption
contract('BondedDeposits', (accounts: string[]) => {
  let account = accounts[0]
  const nonOwner = accounts[1]
  const maxNoticePeriod = 60 * 60 * 24 * 365 * 2 // 2 years
  let mockGoldToken: MockGoldTokenInstance
  let mockGovernance: MockGovernanceInstance
  let mockValidators: MockValidatorsInstance
  let bondedDeposits: BondedDepositsInstance
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

  beforeEach(async () => {
    bondedDeposits = await BondedDeposits.new()
    mockGoldToken = await MockGoldToken.new()
    mockGovernance = await MockGovernance.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(goldTokenRegistryId, mockGoldToken.address)
    await registry.setAddressFor(governanceRegistryId, mockGovernance.address)
    await registry.setAddressFor(validatorsRegistryId, mockValidators.address)
    await bondedDeposits.initialize(registry.address, maxNoticePeriod)
    await bondedDeposits.createAccount()
  })

  describe('#initialize()', () => {
    it('should set the owner', async () => {
      const owner: string = await bondedDeposits.owner()
      assert.equal(owner, account)
    })

    it('should set the maxNoticePeriod', async () => {
      const actual = await bondedDeposits.maxNoticePeriod()
      assert.equal(actual.toNumber(), maxNoticePeriod)
    })

    it('should set the registry address', async () => {
      const registryAddress: string = await bondedDeposits.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should revert if already initialized', async () => {
      await assertRevert(bondedDeposits.initialize(registry.address, maxNoticePeriod))
    })
  })

  describe('#setRegistry()', () => {
    const anAddress: string = accounts[2]

    it('should set the registry when called by the owner', async () => {
      await bondedDeposits.setRegistry(anAddress)
      assert.equal(await bondedDeposits.registry(), anAddress)
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(bondedDeposits.setRegistry(anAddress, { from: nonOwner }))
    })
  })

  describe('#setMaxNoticePeriod()', () => {
    it('should set maxNoticePeriod when called by the owner', async () => {
      await bondedDeposits.setMaxNoticePeriod(1)
      assert.equal((await bondedDeposits.maxNoticePeriod()).toNumber(), 1)
    })

    it('should emit a MaxNoticePeriodSet event', async () => {
      const resp = await bondedDeposits.setMaxNoticePeriod(1)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'MaxNoticePeriodSet', {
        maxNoticePeriod: new BigNumber(1),
      })
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(bondedDeposits.setMaxNoticePeriod(1, { from: nonOwner }))
    })
  })

  describe('#delegateRewards()', () => {
    const delegate = accounts[1]
    let sig

    beforeEach(async () => {
      sig = await getParsedSignatureOfAddress(account, delegate)
    })

    it('should set the rewards delegate', async () => {
      await bondedDeposits.delegateRewards(delegate, sig.v, sig.r, sig.s)
      assert.equal(await bondedDeposits.delegations(delegate), account)
      assert.equal(await bondedDeposits.getRewardsRecipientFromAccount(account), delegate)
      assert.equal(await bondedDeposits.getAccountFromRewardsRecipient(delegate), account)
    })

    it('should emit a VotingDelegated event', async () => {
      const resp = await bondedDeposits.delegateRewards(delegate, sig.v, sig.r, sig.s)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'RewardsDelegated', {
        account,
        delegate,
      })
    })

    it('should revert if the delegate is an account', async () => {
      await bondedDeposits.createAccount({ from: delegate })
      await assertRevert(bondedDeposits.delegateRewards(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the address is already being delegated to', async () => {
      const otherAccount = accounts[2]
      const otherSig = await getParsedSignatureOfAddress(otherAccount, delegate)
      await bondedDeposits.createAccount({ from: otherAccount })
      await bondedDeposits.delegateRewards(delegate, otherSig.v, otherSig.r, otherSig.s, {
        from: otherAccount,
      })
      await assertRevert(bondedDeposits.delegateRewards(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the signature is incorrect', async () => {
      const nonDelegate = accounts[3]
      const incorrectSig = await getParsedSignatureOfAddress(account, nonDelegate)
      await assertRevert(
        bondedDeposits.delegateRewards(delegate, incorrectSig.v, incorrectSig.r, incorrectSig.s)
      )
    })

    describe('when a previous delegation has been made', async () => {
      const newDelegate = accounts[2]
      let newSig
      beforeEach(async () => {
        await bondedDeposits.delegateRewards(delegate, sig.v, sig.r, sig.s)
        newSig = await getParsedSignatureOfAddress(account, newDelegate)
      })

      it('should set the new delegate', async () => {
        await bondedDeposits.delegateRewards(newDelegate, newSig.v, newSig.r, newSig.s)
        assert.equal(await bondedDeposits.delegations(newDelegate), account)
        assert.equal(await bondedDeposits.getRewardsRecipientFromAccount(account), newDelegate)
        assert.equal(await bondedDeposits.getAccountFromRewardsRecipient(newDelegate), account)
      })

      it('should reset the previous delegate', async () => {
        await bondedDeposits.delegateRewards(newDelegate, newSig.v, newSig.r, newSig.s)
        assert.equal(await bondedDeposits.delegations(delegate), NULL_ADDRESS)
      })
    })
  })

  describe('#delegateValidating()', () => {
    const delegate = accounts[1]
    let sig

    beforeEach(async () => {
      sig = await getParsedSignatureOfAddress(account, delegate)
    })

    it('should set the validating delegate', async () => {
      await bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s)
      assert.equal(await bondedDeposits.delegations(delegate), account)
      assert.equal(await bondedDeposits.getValidatorFromAccount(account), delegate)
      assert.equal(await bondedDeposits.getAccountFromValidator(delegate), account)
    })

    it('should emit a ValidatingDelegated event', async () => {
      const resp = await bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'ValidatingDelegated', {
        account,
        delegate,
      })
    })

    it('should revert if the delegate is an account', async () => {
      await bondedDeposits.createAccount({ from: delegate })
      await assertRevert(bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the address is already being delegated to', async () => {
      const otherAccount = accounts[2]
      const otherSig = await getParsedSignatureOfAddress(otherAccount, delegate)
      await bondedDeposits.createAccount({ from: otherAccount })
      await bondedDeposits.delegateValidating(delegate, otherSig.v, otherSig.r, otherSig.s, {
        from: otherAccount,
      })
      await assertRevert(bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the caller is validating', async () => {
      await mockValidators.setValidating(account)
      await assertRevert(bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the signature is incorrect', async () => {
      const nonDelegate = accounts[3]
      const incorrectSig = await getParsedSignatureOfAddress(account, nonDelegate)
      await assertRevert(
        bondedDeposits.delegateValidating(delegate, incorrectSig.v, incorrectSig.r, incorrectSig.s)
      )
    })

    describe('when a previous delegation has been made', async () => {
      const newDelegate = accounts[2]
      let newSig
      beforeEach(async () => {
        await bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s)
        newSig = await getParsedSignatureOfAddress(account, newDelegate)
      })

      it('should set the new delegate', async () => {
        await bondedDeposits.delegateValidating(newDelegate, newSig.v, newSig.r, newSig.s)
        assert.equal(await bondedDeposits.delegations(newDelegate), account)
        assert.equal(await bondedDeposits.getValidatorFromAccount(account), newDelegate)
        assert.equal(await bondedDeposits.getAccountFromValidator(newDelegate), account)
      })

      it('should reset the previous delegate', async () => {
        await bondedDeposits.delegateValidating(newDelegate, newSig.v, newSig.r, newSig.s)
        assert.equal(await bondedDeposits.delegations(delegate), NULL_ADDRESS)
      })
    })
  })

  describe('#delegateVoting()', () => {
    const delegate = accounts[1]
    let sig

    beforeEach(async () => {
      sig = await getParsedSignatureOfAddress(account, delegate)
    })

    it('should set the voting delegate', async () => {
      await bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s)
      assert.equal(await bondedDeposits.delegations(delegate), account)
      assert.equal(await bondedDeposits.getVoterFromAccount(account), delegate)
      assert.equal(await bondedDeposits.getAccountFromVoter(delegate), account)
    })

    it('should emit a VotingDelegated event', async () => {
      const resp = await bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'VotingDelegated', {
        account,
        delegate,
      })
    })

    it('should revert if the delegate is an account', async () => {
      await bondedDeposits.createAccount({ from: delegate })
      await assertRevert(bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the address is already being delegated to', async () => {
      const otherAccount = accounts[2]
      const otherSig = await getParsedSignatureOfAddress(otherAccount, delegate)
      await bondedDeposits.createAccount({ from: otherAccount })
      await bondedDeposits.delegateVoting(delegate, otherSig.v, otherSig.r, otherSig.s, {
        from: otherAccount,
      })
      await assertRevert(bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s))
    })

    it('should revert if the signature is incorrect', async () => {
      const nonDelegate = accounts[3]
      sig = await getParsedSignatureOfAddress(account, nonDelegate)
      await assertRevert(bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s))
    })

    describe('when a previous delegation has been made', async () => {
      const newDelegate = accounts[2]
      let newSig
      beforeEach(async () => {
        await bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s)
        newSig = await getParsedSignatureOfAddress(account, newDelegate)
      })

      it('should set the new delegate', async () => {
        await bondedDeposits.delegateVoting(newDelegate, newSig.v, newSig.r, newSig.s)
        assert.equal(await bondedDeposits.delegations(newDelegate), account)
        assert.equal(await bondedDeposits.getVoterFromAccount(account), newDelegate)
        assert.equal(await bondedDeposits.getAccountFromVoter(newDelegate), account)
      })

      it('should reset the previous delegate', async () => {
        await bondedDeposits.delegateVoting(newDelegate, newSig.v, newSig.r, newSig.s)
        assert.equal(await bondedDeposits.delegations(delegate), NULL_ADDRESS)
      })
    })
  })

  describe('#freezeVoting()', () => {
    it('should set the account voting to frozen', async () => {
      await bondedDeposits.freezeVoting()
      assert.isTrue(await bondedDeposits.isVotingFrozen(account))
    })

    it('should emit a VotingFrozen event', async () => {
      const resp = await bondedDeposits.freezeVoting()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'VotingFrozen', {
        account,
      })
    })

    it('should revert if the account voting is already frozen', async () => {
      await bondedDeposits.freezeVoting()
      await assertRevert(bondedDeposits.freezeVoting())
    })
  })

  describe('#unfreezeVoting()', () => {
    beforeEach(async () => {
      await bondedDeposits.freezeVoting()
    })

    it('should set the account voting to unfrozen', async () => {
      await bondedDeposits.unfreezeVoting()
      assert.isFalse(await bondedDeposits.isVotingFrozen(account))
    })

    it('should emit a VotingUnfrozen event', async () => {
      const resp = await bondedDeposits.unfreezeVoting()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'VotingUnfrozen', {
        account,
      })
    })

    it('should revert if the account voting is already unfrozen', async () => {
      await bondedDeposits.unfreezeVoting()
      await assertRevert(bondedDeposits.unfreezeVoting())
    })
  })

  describe('#deposit()', () => {
    const noticePeriod = 60 * 60 * 24 // 1 day
    const value = 1000
    const expectedWeight = 1033

    it('should add a bonded deposit', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
      const noticePeriods = await bondedDeposits.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 1)
      assert.equal(noticePeriods[0].toNumber(), noticePeriod)
      const [bondedValue, index] = await bondedDeposits.getBondedDeposit(account, noticePeriod)
      assert.equal(bondedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
      const weight = await bondedDeposits.getAccountWeight(account)
      assert.equal(weight.toNumber(), expectedWeight)
    })

    it('should update the total weight', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
      const totalWeight = await bondedDeposits.totalWeight()
      assert.equal(totalWeight.toNumber(), expectedWeight)
    })

    it('should emit a DepositBonded event', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      const resp = await bondedDeposits.deposit(noticePeriod, { value })
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'DepositBonded', {
        account,
        value: new BigNumber(value),
        noticePeriod: new BigNumber(noticePeriod),
      })
    })

    it('should revert when the specified notice period is too large', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await assertRevert(bondedDeposits.deposit(maxNoticePeriod + 1, { value }))
    })

    it('should revert when the specified value is 0', async () => {
      await assertRevert(bondedDeposits.deposit(noticePeriod))
    })

    it('should revert when the account does not exist', async () => {
      await assertRevert(bondedDeposits.deposit(noticePeriod, { value, from: accounts[1] }))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await assertRevert(bondedDeposits.deposit(noticePeriod, { value }))
    })
  })

  describe('#notify()', () => {
    const noticePeriod = 60 * 60 * 24 // 1 day
    const value = 1000
    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
    })

    it('should add a notified deposit', async () => {
      await bondedDeposits.notify(value, noticePeriod)
      const availabilityTime = new BigNumber(noticePeriod).plus(
        (await web3.eth.getBlock('latest')).timestamp
      )
      const availabilityTimes = await bondedDeposits.getAvailabilityTimes(account)
      assert.equal(availabilityTimes.length, 1)
      assert.equal(availabilityTimes[0].toNumber(), availabilityTime.toNumber())

      const [notifiedValue, index] = await bondedDeposits.getNotifiedDeposit(
        account,
        availabilityTime
      )
      assert.equal(notifiedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should remove the bonded deposit', async () => {
      await bondedDeposits.notify(value, noticePeriod)
      const noticePeriods = await bondedDeposits.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 0)
      const [bondedValue, index] = await bondedDeposits.getBondedDeposit(account, noticePeriod)
      assert.equal(bondedValue.toNumber(), 0)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      await bondedDeposits.notify(value, noticePeriod)
      const weight = await bondedDeposits.getAccountWeight(account)
      assert.equal(weight.toNumber(), value)
    })

    it('should update the total weight', async () => {
      await bondedDeposits.notify(value, noticePeriod)
      const totalWeight = await bondedDeposits.totalWeight()
      assert.equal(totalWeight.toNumber(), value)
    })

    it('should emit a DepositNotified event', async () => {
      const resp = await bondedDeposits.notify(value, noticePeriod)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'DepositNotified', {
        account,
        value: new BigNumber(value),
        noticePeriod: new BigNumber(noticePeriod),
        availabilityTime: new BigNumber(noticePeriod).plus(
          (await web3.eth.getBlock('latest')).timestamp
        ),
      })
    })

    it('should revert when the value of the bonded deposit is 0', async () => {
      await assertRevert(bondedDeposits.notify(1, noticePeriod + 1))
    })

    it('should revert when value is greater than the value of the bonded deposit', async () => {
      await assertRevert(bondedDeposits.notify(value + 1, noticePeriod))
    })

    it('should revert when the value is 0', async () => {
      await assertRevert(bondedDeposits.notify(0, noticePeriod))
    })

    it('should revert if the account is validating', async () => {
      await mockValidators.setValidating(account)
      await assertRevert(bondedDeposits.notify(value, noticePeriod))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(bondedDeposits.notify(value, noticePeriod))
    })
  })

  describe('#rebond()', () => {
    const value = 1000
    const expectedWeight = 1033
    let availabilityTime: BigNumber

    beforeEach(async () => {
      const noticePeriod = 60 * 60 * 24 // 1 day
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
      await bondedDeposits.notify(value, noticePeriod)
      availabilityTime = new BigNumber(noticePeriod).plus(
        (await web3.eth.getBlock('latest')).timestamp
      )
    })

    it('should add a bonded deposit', async () => {
      await bondedDeposits.rebond(value, availabilityTime)
      const noticePeriods = await bondedDeposits.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 1)
      const noticePeriod = availabilityTime
        .minus((await web3.eth.getBlock('latest')).timestamp)
        .toNumber()
      assert.equal(noticePeriods[0].toNumber(), noticePeriod)
      const [bondedValue, index] = await bondedDeposits.getBondedDeposit(account, noticePeriod)
      assert.equal(bondedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should remove a notified deposit', async () => {
      await bondedDeposits.rebond(value, availabilityTime)
      const availabilityTimes = await bondedDeposits.getAvailabilityTimes(account)
      assert.equal(availabilityTimes.length, 0)
      const [notifiedValue, index] = await bondedDeposits.getNotifiedDeposit(
        account,
        availabilityTime
      )
      assert.equal(notifiedValue.toNumber(), 0)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      await bondedDeposits.rebond(value, availabilityTime)
      const weight = await bondedDeposits.getAccountWeight(account)
      assert.equal(weight.toNumber(), expectedWeight)
    })

    it('should update the total weight', async () => {
      await bondedDeposits.rebond(value, availabilityTime)
      const totalWeight = await bondedDeposits.totalWeight()
      assert.equal(totalWeight.toNumber(), expectedWeight)
    })

    it('should emit a DepositRebonded event', async () => {
      const resp = await bondedDeposits.rebond(value, availabilityTime)
      const noticePeriod = availabilityTime.minus((await web3.eth.getBlock('latest')).timestamp)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'DepositRebonded', {
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
      await assertRevert(bondedDeposits.rebond(value, availabilityTime))
    })

    it('should revert when the value of the notified deposit is 0', async () => {
      await assertRevert(bondedDeposits.rebond(value, availabilityTime.plus(1)))
    })

    it('should revert when the value is 0', async () => {
      await assertRevert(bondedDeposits.rebond(0, availabilityTime))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(bondedDeposits.rebond(value, availabilityTime))
    })
  })

  describe('#withdraw()', () => {
    const noticePeriod = 60 * 60 * 24 // 1 day
    const value = 1000
    let availabilityTime: BigNumber

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
      await bondedDeposits.notify(value, noticePeriod)
      availabilityTime = new BigNumber(noticePeriod).plus(
        (await web3.eth.getBlock('latest')).timestamp
      )
    })

    it('should remove the notified deposit', async () => {
      await timeTravel(noticePeriod, web3)
      await bondedDeposits.withdraw(availabilityTime)

      const availabilityTimes = await bondedDeposits.getAvailabilityTimes(account)
      assert.equal(availabilityTimes.length, 0)
    })

    it('should update the account weight', async () => {
      await timeTravel(noticePeriod, web3)
      await bondedDeposits.withdraw(availabilityTime)

      const weight = await bondedDeposits.getAccountWeight(account)
      assert.equal(weight.toNumber(), 0)
    })

    it('should update the total weight', async () => {
      await timeTravel(noticePeriod, web3)
      await bondedDeposits.withdraw(availabilityTime)

      const totalWeight = await bondedDeposits.totalWeight()
      assert.equal(totalWeight.toNumber(), 0)
    })

    it('should emit a Withdrawal event', async () => {
      await timeTravel(noticePeriod, web3)
      const resp = await bondedDeposits.withdraw(availabilityTime)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches(log, 'Withdrawal', {
        account,
        value: new BigNumber(value),
      })
    })

    it('should revert if the account is validating', async () => {
      await mockValidators.setValidating(account)
      await assertRevert(bondedDeposits.withdraw(availabilityTime))
    })

    it('should revert when the notice period has not passed', async () => {
      await assertRevert(bondedDeposits.withdraw(availabilityTime))
    })

    it('should revert when the value of the notified deposit is 0', async () => {
      await timeTravel(noticePeriod, web3)
      await assertRevert(bondedDeposits.withdraw(availabilityTime.plus(1)))
    })

    it('should revert if the caller is voting', async () => {
      await timeTravel(noticePeriod, web3)
      await mockGovernance.setVoting(account)
      await assertRevert(bondedDeposits.withdraw(availabilityTime))
    })
  })

  describe('#increaseNoticePeriod()', () => {
    const noticePeriod = 60 * 60 * 24 // 1 day
    const value = 1000
    const increase = noticePeriod
    const expectedWeight = 1047

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await bondedDeposits.deposit(noticePeriod, { value })
    })

    it('should update the bonded deposit', async () => {
      await bondedDeposits.increaseNoticePeriod(value, noticePeriod, increase)
      const noticePeriods = await bondedDeposits.getNoticePeriods(account)
      assert.equal(noticePeriods.length, 1)
      assert.equal(noticePeriods[0].toNumber(), noticePeriod + increase)
      const [bondedValue, index] = await bondedDeposits.getBondedDeposit(
        account,
        noticePeriod + increase
      )
      assert.equal(bondedValue.toNumber(), value)
      assert.equal(index.toNumber(), 0)
    })

    it('should update the account weight', async () => {
      await bondedDeposits.increaseNoticePeriod(value, noticePeriod, increase)
      const weight = await bondedDeposits.getAccountWeight(account)
      assert.equal(weight.toNumber(), expectedWeight)
    })

    it('should update the total weight', async () => {
      await bondedDeposits.increaseNoticePeriod(value, noticePeriod, increase)
      const totalWeight = await bondedDeposits.totalWeight()
      assert.equal(totalWeight.toNumber(), expectedWeight)
    })

    it('should emit a NoticePeriodIncreased event', async () => {
      const resp = await bondedDeposits.increaseNoticePeriod(value, noticePeriod, increase)
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
      await assertRevert(bondedDeposits.increaseNoticePeriod(0, noticePeriod, increase))
    })

    it('should revert if the increase is 0', async () => {
      await assertRevert(bondedDeposits.increaseNoticePeriod(value, noticePeriod, 0))
    })

    it('should revert if the bonded deposit is smaller than the value', async () => {
      await assertRevert(bondedDeposits.increaseNoticePeriod(value, noticePeriod + 1, increase))
    })

    it('should revert if the caller is voting', async () => {
      await mockGovernance.setVoting(account)
      await assertRevert(bondedDeposits.increaseNoticePeriod(value, noticePeriod, increase))
    })
  })

  describe('#getAccountFromVoter()', () => {
    describe('when the account is not delegating', () => {
      it('should return the account when passed the account', async () => {
        assert.equal(await bondedDeposits.getAccountFromVoter(account), account)
      })

      it('should revert when passed a delegate that is not the voting delegate for the account', async () => {
        const rewardsDelegate = accounts[2]
        const sig = await getParsedSignatureOfAddress(account, rewardsDelegate)
        await bondedDeposits.delegateRewards(rewardsDelegate, sig.v, sig.r, sig.s)
        await assertRevert(bondedDeposits.getAccountFromVoter(rewardsDelegate))
      })
    })

    describe('when the account is delegating', () => {
      const delegate = accounts[1]

      beforeEach(async () => {
        const sig = await getParsedSignatureOfAddress(account, delegate)
        await bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s)
      })

      it('should return the account when passed the delegate', async () => {
        assert.equal(await bondedDeposits.getAccountFromVoter(delegate), account)
      })

      it('should return the account when passed the account', async () => {
        assert.equal(await bondedDeposits.getAccountFromVoter(account), account)
      })

      it('should revert when passed a delegate that is not the voting delegate for the account', async () => {
        const rewardsDelegate = accounts[2]
        const sig = await getParsedSignatureOfAddress(account, rewardsDelegate)
        await bondedDeposits.delegateRewards(rewardsDelegate, sig.v, sig.r, sig.s)
        await assertRevert(bondedDeposits.getAccountFromVoter(rewardsDelegate))
      })
    })
  })

  describe('#getAccountFromValidator()', () => {
    describe('when the account is not delegating', () => {
      it('should return the account when passed the account', async () => {
        assert.equal(await bondedDeposits.getAccountFromValidator(account), account)
      })

      it('should revert when passed a delegate that is not the validating delegate for the account', async () => {
        const rewardsDelegate = accounts[2]
        const sig = await getParsedSignatureOfAddress(account, rewardsDelegate)
        await bondedDeposits.delegateRewards(rewardsDelegate, sig.v, sig.r, sig.s)
        await assertRevert(bondedDeposits.getAccountFromValidator(rewardsDelegate))
      })
    })

    describe('when the account is delegating', () => {
      const delegate = accounts[1]

      beforeEach(async () => {
        const sig = await getParsedSignatureOfAddress(account, delegate)
        await bondedDeposits.delegateValidating(delegate, sig.v, sig.r, sig.s)
      })

      it('should return the account when passed the delegate', async () => {
        assert.equal(await bondedDeposits.getAccountFromValidator(delegate), account)
      })

      it('should return the account when passed the account', async () => {
        assert.equal(await bondedDeposits.getAccountFromValidator(account), account)
      })

      it('should revert when passed a delegate that is not the voting delegate for the account', async () => {
        const rewardsDelegate = accounts[2]
        const sig = await getParsedSignatureOfAddress(account, rewardsDelegate)
        await bondedDeposits.delegateRewards(rewardsDelegate, sig.v, sig.r, sig.s)
        await assertRevert(bondedDeposits.getAccountFromValidator(rewardsDelegate))
      })
    })
  })

  describe('#getAccountFromRewardsRecipient()', () => {
    describe('when the account is not delegating', () => {
      it('should return the account when passed the account', async () => {
        assert.equal(await bondedDeposits.getAccountFromRewardsRecipient(account), account)
      })

      it('should revert when passed a delegate that is not the rewards delegate for the account', async () => {
        const votingDelegate = accounts[2]
        const sig = await getParsedSignatureOfAddress(account, votingDelegate)
        await bondedDeposits.delegateVoting(votingDelegate, sig.v, sig.r, sig.s)
        await assertRevert(bondedDeposits.getAccountFromRewardsRecipient(votingDelegate))
      })
    })

    describe('when the account is delegating', () => {
      const delegate = accounts[1]

      beforeEach(async () => {
        const sig = await getParsedSignatureOfAddress(account, delegate)
        await bondedDeposits.delegateRewards(delegate, sig.v, sig.r, sig.s)
      })

      it('should return the account when passed the delegate', async () => {
        assert.equal(await bondedDeposits.getAccountFromRewardsRecipient(delegate), account)
      })

      it('should return the account when passed the account', async () => {
        assert.equal(await bondedDeposits.getAccountFromRewardsRecipient(account), account)
      })

      it('should revert when passed a delegate that is not the rewards delegate for the account', async () => {
        const votingDelegate = accounts[2]
        const sig = await getParsedSignatureOfAddress(account, votingDelegate)
        await bondedDeposits.delegateVoting(votingDelegate, sig.v, sig.r, sig.s)
        await assertRevert(bondedDeposits.getAccountFromRewardsRecipient(votingDelegate))
      })
    })
  })

  describe('#isVoting()', () => {
    describe('when the account is not delegating', () => {
      it('should return false if the account is not voting in governance or validator elections', async () => {
        assert.isFalse(await bondedDeposits.isVoting(account))
      })

      it('should return true if the account is voting in governance', async () => {
        await mockGovernance.setVoting(account)
        assert.isTrue(await bondedDeposits.isVoting(account))
      })

      it('should return true if the account is voting in validator elections', async () => {
        await mockValidators.setVoting(account)
        assert.isTrue(await bondedDeposits.isVoting(account))
      })

      it('should return true if the account is voting in governance and validator elections', async () => {
        await mockGovernance.setVoting(account)
        await mockValidators.setVoting(account)
        assert.isTrue(await bondedDeposits.isVoting(account))
      })
    })

    describe('when the account is delegating', () => {
      const delegate = accounts[1]

      beforeEach(async () => {
        const sig = await getParsedSignatureOfAddress(account, delegate)
        await bondedDeposits.delegateVoting(delegate, sig.v, sig.r, sig.s)
      })

      it('should return false if the delegate is not voting in governance or validator elections', async () => {
        assert.isFalse(await bondedDeposits.isVoting(account))
      })

      it('should return true if the delegate is voting in governance', async () => {
        await mockGovernance.setVoting(delegate)
        assert.isTrue(await bondedDeposits.isVoting(account))
      })

      it('should return true if the delegate is voting in validator elections', async () => {
        await mockValidators.setVoting(delegate)
        assert.isTrue(await bondedDeposits.isVoting(account))
      })

      it('should return true if the delegate is voting in governance and validator elections', async () => {
        await mockGovernance.setVoting(delegate)
        await mockValidators.setVoting(delegate)
        assert.isTrue(await bondedDeposits.isVoting(account))
      })
    })
  })

  describe('#getDepositWeight()', () => {
    const value = new BigNumber(521000)
    const oneDay = new BigNumber(60 * 60 * 24)
    it('should return the deposit value when notice period is zero', async () => {
      const noticePeriod = new BigNumber(0)
      assertEqualBN(await bondedDeposits.getDepositWeight(value, noticePeriod), value)
    })

    it('should return the deposit value when notice period is less than one day', async () => {
      const noticePeriod = oneDay.minus(1)
      assertEqualBN(await bondedDeposits.getDepositWeight(value, noticePeriod), value)
    })

    it('should return the deposit value times 1.0333 when notice period is one day', async () => {
      const noticePeriod = oneDay
      assertEqualBN(
        await bondedDeposits.getDepositWeight(value, noticePeriod),
        value.times(1.0333).integerValue(BigNumber.ROUND_DOWN)
      )
    })

    it('should return the deposit value times 1.047 when notice period is two days', async () => {
      const noticePeriod = oneDay.times(2)
      assertEqualBN(
        await bondedDeposits.getDepositWeight(value, noticePeriod),
        value.times(1.047).integerValue(BigNumber.ROUND_DOWN)
      )
    })

    it('should return the deposit value times 1.1823 when notice period is 30 days', async () => {
      const noticePeriod = oneDay.times(30)
      assertEqualBN(
        await bondedDeposits.getDepositWeight(value, noticePeriod),
        value.times(1.1823).integerValue(BigNumber.ROUND_DOWN)
      )
    })

    it('should return the deposit value times 2.103 when notice period is 3 years', async () => {
      const noticePeriod = oneDay.times(365).times(3)
      assertEqualBN(
        await bondedDeposits.getDepositWeight(value, noticePeriod),
        value.times(2.103).integerValue(BigNumber.ROUND_DOWN)
      )
    })
  })

  describe('when there are multiple deposits, notifies, rebondings, notice period increases, and withdrawals', () => {
    beforeEach(async () => {
      for (const accountToCreate of accounts) {
        // Account for `account` has already been created.
        if (accountToCreate !== account) {
          await bondedDeposits.createAccount({ from: accountToCreate })
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
      const bonded: Map<string, Map<string, BigNumber>> = new Map()
      const notified: Map<string, Map<string, BigNumber>> = new Map()
      const noticePeriods: Map<string, Set<string>> = new Map()
      const availabilityTimes: Map<string, Set<string>> = new Map()
      const selectedAccounts = accounts.slice(0, numAccounts)
      for (const acc of selectedAccounts) {
        // Map keys, set elements appear not to be able to be BigNumbers, so we use strings instead.
        bonded.set(acc, new Map())
        notified.set(acc, new Map())
        noticePeriods.set(acc, new Set([]))
        availabilityTimes.set(acc, new Set([]))
      }

      return { bonded, notified, noticePeriods, availabilityTimes, selectedAccounts }
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
        bonded,
        notified,
        noticePeriods,
        availabilityTimes,
      } = initializeState(numAccounts)

      for (let i = 0; i < numActions; i++) {
        const blockTime = 5
        await timeTravel(blockTime, web3)
        account = rndElement(selectedAccounts)

        const accountBondedDeposits = bonded.get(account)
        const accountNotifiedDeposits = notified.get(account)
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

        const getBondedDepositValue = (noticePeriod: string) =>
          getOrElse(accountBondedDeposits, noticePeriod, new BigNumber(0))
        const getNotifiedDepositValue = (availabilityTime: string) =>
          getOrElse(accountNotifiedDeposits, availabilityTime, new BigNumber(0))

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
          await bondedDeposits.deposit(noticePeriod, { value, from: account })
          accountNoticePeriods.add(noticePeriod)
          accountBondedDeposits.set(noticePeriod, getBondedDepositValue(noticePeriod).plus(value))
        } else if (actionType === ActionType.Notify || actionType === ActionType.Increase) {
          const noticePeriod = rndSetElement(accountNoticePeriods)
          const bondedDepositValue = getBondedDepositValue(noticePeriod)
          const value = randomSometimesMaximumValue(bondedDepositValue)

          if (value.eq(bondedDepositValue)) {
            accountBondedDeposits.delete(noticePeriod)
            accountNoticePeriods.delete(noticePeriod)
          } else {
            accountBondedDeposits.set(noticePeriod, bondedDepositValue.minus(value))
          }

          if (actionType === ActionType.Notify) {
            await bondedDeposits.notify(value, noticePeriod, { from: account })
            const availabilityTime = new BigNumber(noticePeriod)
              .plus((await web3.eth.getBlock('latest')).timestamp)
              .valueOf()
            accountAvailabilityTimes.add(availabilityTime)
            accountNotifiedDeposits.set(
              availabilityTime,
              getNotifiedDepositValue(availabilityTime).plus(value)
            )
          } else {
            // Notice period increase of at most 10 blocks.
            const increase = BigNumber.random()
              .times(10)
              .times(blockTime)
              .integerValue()
              .plus(1)
            await bondedDeposits.increaseNoticePeriod(value, noticePeriod, increase, {
              from: account,
            })
            const increasedNoticePeriod = increase.plus(noticePeriod).valueOf()
            accountNoticePeriods.add(increasedNoticePeriod)
            accountBondedDeposits.set(
              increasedNoticePeriod,
              getBondedDepositValue(increasedNoticePeriod).plus(value)
            )
          }
        } else if (actionType === ActionType.Rebond) {
          const availabilityTime = rndSetElement(rebondableAvailabilityTimes)
          const notifiedDepositValue = getNotifiedDepositValue(availabilityTime)
          const value = randomSometimesMaximumValue(notifiedDepositValue)
          await bondedDeposits.rebond(value, availabilityTime, { from: account })

          if (value.eq(notifiedDepositValue)) {
            accountNotifiedDeposits.delete(availabilityTime)
            accountAvailabilityTimes.delete(availabilityTime)
          } else {
            accountNotifiedDeposits.set(availabilityTime, notifiedDepositValue.minus(value))
          }
          const noticePeriod = new BigNumber(availabilityTime)
            .minus((await web3.eth.getBlock('latest')).timestamp)
            .valueOf()
          accountBondedDeposits.set(noticePeriod, getBondedDepositValue(noticePeriod).plus(value))
          accountNoticePeriods.add(noticePeriod)
        } else if (actionType === ActionType.Withdraw) {
          const availabilityTime = rndSetElement(withdrawableAvailabilityTimes)
          await bondedDeposits.withdraw(availabilityTime, { from: account })
          accountAvailabilityTimes.delete(availabilityTime)
          accountNotifiedDeposits.delete(availabilityTime)
        } else {
          assert.isTrue(false)
        }

        // Sanity check our test implementation.
        selectedAccounts.forEach((acc) => {
          if (bonded.get(acc).size > 0) {
            assert.hasAllKeys(
              noticePeriods.get(acc),
              Array.from(bonded.get(acc).keys()),
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
          const actualNoticePeriods = await bondedDeposits.getNoticePeriods(acc)

          assert.lengthOf(actualNoticePeriods, noticePeriods.get(acc).size)
          for (let k = 0; k < actualNoticePeriods.length; k++) {
            const noticePeriod = actualNoticePeriods[k]
            assert.isTrue(noticePeriods.get(acc).has(noticePeriod.valueOf()))
            const [actualValue, actualIndex] = await bondedDeposits.getBondedDeposit(
              acc,
              noticePeriod
            )
            assertEqualBN(actualIndex, k)
            const expectedValue = bonded.get(acc).get(noticePeriod.valueOf())
            assertEqualBN(actualValue, expectedValue)
            assertEqualBN(actualNoticePeriods[actualIndex.toNumber()], noticePeriod)
            expectedAccountWeight = expectedAccountWeight.plus(
              await bondedDeposits.getDepositWeight(expectedValue, noticePeriod)
            )
          }

          const actualAvailabilityTimes = await bondedDeposits.getAvailabilityTimes(acc)

          assert.equal(actualAvailabilityTimes.length, availabilityTimes.get(acc).size)
          for (let k = 0; k < actualAvailabilityTimes.length; k++) {
            const availabilityTime = actualAvailabilityTimes[k]
            assert.isTrue(availabilityTimes.get(acc).has(availabilityTime.valueOf()))
            const [actualValue, actualIndex] = await bondedDeposits.getNotifiedDeposit(
              acc,
              availabilityTime
            )
            assertEqualBN(actualIndex, k)
            const expectedValue = notified.get(acc).get(availabilityTime.valueOf())
            assertEqualBN(actualValue, expectedValue)
            assertEqualBN(actualAvailabilityTimes[actualIndex.toNumber()], availabilityTime)
            expectedAccountWeight = expectedAccountWeight.plus(expectedValue)
          }
          assertEqualBN(await bondedDeposits.getAccountWeight(acc), expectedAccountWeight)
          expectedTotalWeight = expectedTotalWeight.plus(expectedAccountWeight)
        }
      }
    }

    it('should match a simple typescript implementation', async () => {
      const numActions = 100
      const numAccounts = 2
      await executeActionsAndAssertState(numActions, numAccounts)
    })
  })
})
