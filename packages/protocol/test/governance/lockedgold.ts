import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assertLogMatches,
  assertLogMatches2,
  assertRevert,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  LockedGoldContract,
  LockedGoldInstance,
  MockElectionContract,
  MockElectionInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const LockedGold: LockedGoldContract = artifacts.require('LockedGold')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'

const HOUR = 60 * 60
const DAY = 24 * HOUR
let authorizationTests = { voter: {}, validator: {} }

contract('LockedGold', (accounts: string[]) => {
  let account = accounts[0]
  const nonOwner = accounts[1]
  const unlockingPeriod = 3 * DAY
  let lockedGold: LockedGoldInstance
  let mockElection: MockElectionInstance
  let mockValidators: MockValidatorsInstance
  let registry: RegistryInstance

  const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  beforeEach(async () => {
    const mockGoldToken: MockGoldTokenInstance = await MockGoldToken.new()
    lockedGold = await LockedGold.new()
    mockElection = await MockElection.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await lockedGold.initialize(registry.address, unlockingPeriod)
    await lockedGold.createAccount()

    authorizationTests.voter = {
      fn: lockedGold.authorizeVoter,
      getAuthorizedFromAccount: lockedGold.getVoterFromAccount,
      getAccountFromActiveAuthorized: lockedGold.getAccountFromActiveVoter,
      getAccountFromAuthorized: lockedGold.getAccountFromVoter,
    }
    authorizationTests.validator = {
      fn: lockedGold.authorizeValidator,
      getAuthorizedFromAccount: lockedGold.getValidatorFromAccount,
      getAccountFromActiveAuthorized: lockedGold.getAccountFromActiveValidator,
      getAccountFromAuthorized: lockedGold.getAccountFromValidator,
    }
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

  Object.keys(authorizationTests).forEach((key) => {
    describe('authorization tests:', () => {
      let authorizationTest: any
      beforeEach(async () => {
        authorizationTest = authorizationTests[key]
      })

      describe(`#authorize${capitalize(key)}()`, () => {
        const authorized = accounts[1]
        let sig

        beforeEach(async () => {
          sig = await getParsedSignatureOfAddress(web3, account, authorized)
        })

        it(`should set the authorized ${key}`, async () => {
          await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
          assert.equal(await authorizationTest.getAccountFromActiveAuthorized(authorized), account)
        })

        it(`should emit a ${capitalize(key)}Authorized event`, async () => {
          const resp = await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          const expected = { account }
          expected[key] = authorized
          assertLogMatches(log, `${capitalize(key)}Authorized`, expected)
        })

        it(`should revert if the ${key} is an account`, async () => {
          await lockedGold.createAccount({ from: authorized })
          await assertRevert(authorizationTest.fn(authorized, sig.v, sig.r, sig.s))
        })

        it(`should revert if the ${key} is already authorized`, async () => {
          const otherAccount = accounts[2]
          const otherSig = await getParsedSignatureOfAddress(web3, otherAccount, authorized)
          await lockedGold.createAccount({ from: otherAccount })
          await authorizationTest.fn(authorized, otherSig.v, otherSig.r, otherSig.s, {
            from: otherAccount,
          })
          await assertRevert(authorizationTest.fn(authorized, sig.v, sig.r, sig.s))
        })

        it('should revert if the signature is incorrect', async () => {
          const nonVoter = accounts[3]
          const incorrectSig = await getParsedSignatureOfAddress(web3, account, nonVoter)
          await assertRevert(
            authorizationTest.fn(authorized, incorrectSig.v, incorrectSig.r, incorrectSig.s)
          )
        })

        describe('when a previous authorization has been made', async () => {
          const newAuthorized = accounts[2]
          let newSig
          beforeEach(async () => {
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
            newSig = await getParsedSignatureOfAddress(web3, account, newAuthorized)
            await authorizationTest.fn(newAuthorized, newSig.v, newSig.r, newSig.s)
          })

          it(`should set the new authorized ${key}`, async () => {
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), newAuthorized)
            assert.equal(
              await authorizationTest.getAccountFromActiveAuthorized(newAuthorized),
              account
            )
          })

          it('should preserve the previous authorization', async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(authorized), account)
          })
        })
      })

      describe(`#getAccountFrom${capitalize(key)}()`, () => {
        describe(`when the account has not authorized a ${key}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAccountFromActiveAuthorized(account), account)
          })

          it('should revert when passed an address that is not an account', async () => {
            await assertRevert(authorizationTest.getAccountFromActiveAuthorized(accounts[1]))
          })
        })

        describe(`when the account has authorized a ${key}`, () => {
          const authorized = accounts[1]
          beforeEach(async () => {
            const sig = await getParsedSignatureOfAddress(web3, account, authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          })

          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAccountFromActiveAuthorized(account), account)
          })

          it(`should return the account when passed the ${key}`, async () => {
            assert.equal(
              await authorizationTest.getAccountFromActiveAuthorized(authorized),
              account
            )
          })
        })
      })

      describe(`#get${capitalize(key)}FromAccount()`, () => {
        describe(`when the account has not authorized a ${key}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), account)
          })

          it('should revert when not passed an account', async () => {
            await assertRevert(authorizationTest.getAuthorizedFromAccount(accounts[1]), account)
          })
        })

        describe(`when the account has authorized a ${key}`, () => {
          const authorized = accounts[1]

          beforeEach(async () => {
            const sig = await getParsedSignatureOfAddress(web3, account, authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          })

          it(`should return the ${key} when passed the account`, async () => {
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
          })
        })
      })
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

    describe('when there are balance requirements', () => {
      const balanceRequirement = 10
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        await mockValidators.setAccountBalanceRequirement(account, balanceRequirement)
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
    const value = 1000
    const index = 0
    let resp: any
    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        await lockedGold.unlock(value)
        resp = await lockedGold.relock(index)
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

      it('should emit a GoldLocked event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches(log, 'GoldLocked', {
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

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(lockedGold.relock(index))
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
})
