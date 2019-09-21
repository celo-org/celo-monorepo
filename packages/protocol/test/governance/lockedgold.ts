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

contract('LockedGold', (accounts: string[]) => {
  let account = accounts[0]
  const nonOwner = accounts[1]
  const unlockingPeriod = 3 * DAY
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

  beforeEach(async () => {
    lockedGold = await LockedGold.new()
    mockGoldToken = await MockGoldToken.new()
    mockGovernance = await MockGovernance.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.GoldToken, mockGoldToken.address)
    await registry.setAddressFor(CeloContractName.Governance, mockGovernance.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await lockedGold.initialize(registry.address, unlockingPeriod)
    await lockedGold.createAccount()
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
      const period: string = await lockedGold.unlockingPeriod()
      assert.equal(unlockingPeriod, period)
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

  const authorizationTests = [
    {
      name: 'Voter',
      fn: lockedGold.authorizeVoter,
      getFromAccount: lockedGold.getVoterFromAccount,
      getAccount: lockedGold.getAccountFromVoter,
    },
    {
      name: 'Validator',
      fn: lockedGold.authorizeValidator,
      getFromAccount: lockedGold.getValidatorFromAccount,
      getAccount: lockedGold.getAccountFromValidator,
    },
  ]
  for (const test in authorizationTests) {
    describe(`#authorize${test.name}()`, () => {
      const authorized = accounts[1]
      let sig

      beforeEach(async () => {
        sig = await getParsedSignatureOfAddress(account, authorized)
      })

      it(`should set the authorized ${test.name}`, async () => {
        await test.fn(authorized, sig.v, sig.r, sig.s)
        assert.equal(await lockedGold.authorizedBy(authorized), account)
        assert.equal(await test.getFromAccount(account), authorized)
        assert.equal(await test.getAccount(authorized), account)
      })

      it(`should emit a ${test.name}Authorized event`, async () => {
        const resp = await test.fn(authorized, sig.v, sig.r, sig.s)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches(log, `${test.name}Authorized`, {
          account,
          authorized,
        })
      })

      it(`should revert if the ${test.name} is an account`, async () => {
        await lockedGold.createAccount({ from: authorized })
        await assertRevert(test.fn(authorized, sig.v, sig.r, sig.s))
      })

      it(`should revert if the ${test.name} is already authorized`, async () => {
        const otherAccount = accounts[2]
        const otherSig = await getParsedSignatureOfAddress(otherAccount, authorized)
        await lockedGold.createAccount({ from: otherAccount })
        await test.fn(authorized, otherSig.v, otherSig.r, otherSig.s, {
          from: otherAccount,
        })
        await assertRevert(test.fn(authorized, sig.v, sig.r, sig.s))
      })

      it('should revert if the signature is incorrect', async () => {
        const nonVoter = accounts[3]
        const incorrectSig = await getParsedSignatureOfAddress(account, nonVoter)
        await assertRevert(test.fn(authorized, incorrectSig.v, incorrectSig.r, incorrectSig.s))
      })

      describe('when a previous authorization has been made', async () => {
        const newAuthorized = accounts[2]
        let newSig
        beforeEach(async () => {
          await test.fn(authorized, sig.v, sig.r, sig.s)
          newSig = await getParsedSignatureOfAddress(account, newAuthorized)
          await test.fn(newAuthorized, newSig.v, newSig.r, newSig.s)
        })

        it(`should set the new authorized ${test.name}`, async () => {
          assert.equal(await lockedGold.authorizedBy(newAuthorized), account)
          assert.equal(await test.getFromAccount(account), newAuthorized)
          assert.equal(await test.getAccount(newAuthorized), account)
        })

        it('should reset the previous authorization', async () => {
          assert.equal(await lockedGold.authorizedBy(authorized), NULL_ADDRESS)
        })
      })
    })

    describe(`#getAccountFrom${test.name}()`, () => {
      describe(`when the account has not authorized a ${test.name}`, () => {
        it('should return the account when passed the account', async () => {
          assert.equal(await test.getAccount(account), account)
        })

        it('should revert when passed an address that is not an account', async () => {
          await assertRevert(test.getAccount(accounts[1]))
        })
      })

      describe(`when the account has authorized a ${test.name}`, () => {
        const authorized = accounts[1]
        before(async () => {
          const sig = await getParsedSignatureOfAddress(account, voter)
          await test.fn(authorized, sig.v, sig.r, sig.s)
        })

        it('should return the account when passed the account', async () => {
          assert.equal(await test.getAccount(account), account)
        })

        it(`should return the account when passed the ${test.name}`, async () => {
          assert.equal(await test.getAccount(authorized), account)
        })
      })
    })

    describe(`#get${test.name}FromAccount()`, () => {
      describe(`when the account has not authorized a ${test.name}`, () => {
        it('should return the account when passed the account', async () => {
          assert.equal(await test.getFromAccount(account), account)
        })

        it('should revert when not passed an account', async () => {
          await assertRevert(test.getFromAccount(account), account)
        })
      })

      describe(`when the account has authorized a ${test.name}`, () => {
        const authorized = accounts[1]

        before(async () => {
          const sig = await getParsedSignatureOfAddress(account, authorized)
          await test.fn(authorized, sig.v, sig.r, sig.s)
        })

        it(`should return the ${test.name} when passed the account`, async () => {
          assert.equal(await test.getFromAccount(account), authorized)
        })
      })
    })
  }

  describe('#lock()', () => {
    const value = 1000

    it("should increase the account's nonvoting locked gold balance", async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assert.equal(await lockedGold.getAccountNonvotingLockedGold(account), value)
    })

    it("should increase the account's total locked gold balance", async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assert.equal(await lockedGold.getAccountTotalLockedGold(account), value)
    })

    it('should increase the nonvoting locked gold balance', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assert.equal(await lockedGold.getNonvotingLockedGold(), value)
    })

    it('should increase the total locked gold balance', async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await lockedGold.lock({ value })
      assert.equal(await lockedGold.getTotalLockedGold(), value)
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
      before(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        resp = await lockedGold.unlock(value)
        availabilityTime = new BigNumber(unlockingPeriod).plus(
          (await web3.eth.getBlock('latest')).timestamp
        )
      })

      it('should add a pending withdrawal', async () => {
        const pendingWithdrawals = await lockedGold.getPendingWithdrawals(account)
        assert.equal(pendingWithdrawals.length, 1)
        assert.equal(pendingWithdrawals[0], value)
        assert.equal(pendingWithdrawals[1], availabilityTime)
      })

      it("should decrease the account's nonvoting locked gold balance", async () => {
        assert.equal(await lockedGold.getAccountNonvotingLockedGold(account), 0)
      })

      it("should decrease the account's total locked gold balance", async () => {
        assert.equal(await lockedGold.getAccountTotalLockedGold(account), 0)
      })

      it('should decrease the nonvoting locked gold balance', async () => {
        assert.equal(await lockedGold.getNonvotingLockedGold(), 0)
      })

      it('should decrease the total locked gold balance', async () => {
        assert.equal(await lockedGold.getTotalLockedGold(), 0)
      })

      it('should emit a GoldUnlocked event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches(log, 'GoldUnlocked', {
          account,
          value: new BigNumber(value),
          available,
        })
      })
    })

    describe('when there are balance requirements', () => {
      let mustMaintain: any
      before(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        // Allow ourselves to call `setAccountMustMaintain()`
        await registry.setAddressFor('Election', account)
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        const mustMaintain = { value: 100, timestamp: timestamp + DAY }
        await lockedGold.setAccountMustMaintain(account, mustMaintain.value, mustMaintain.timestamp)
      })

      describe('when unlocking would yield a locked gold balance less than the required value', () => {
        describe('when the the current time is earlier than the requirement time', () => {
          it('should revert', async () => {
            await assertRevert(lockedGold.unlock(value))
          })
        })

        describe('when the the current time is later than the requirement time', () => {
          it('should succeed', async () => {
            await timeTravel(web3, DAY)
            await lockedGold.unlock(value)
          })
        })
      })

      describe('when unlocking would yield a locked gold balance equal to the required value', () => {
        it('should succeed', async () => {
          await lockedGold.unlock(value - mustMaintain.value)
        })
      })
    })
  })

  describe('#relock()', () => {
    const value = 1000
    const index = 0
    describe('when a pending withdrawal exists', () => {
      before(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        await lockedGold.unlock(value)
        resp = await lockedGold.relock(index)
      })

      it("should increase the account's nonvoting locked gold balance", async () => {
        assert.equal(await lockedGold.getAccountNonvotingLockedGold(account), value)
      })

      it("should increase the account's total locked gold balance", async () => {
        assert.equal(await lockedGold.getAccountTotalLockedGold(account), value)
      })

      it('should increase the nonvoting locked gold balance', async () => {
        assert.equal(await lockedGold.getNonvotingLockedGold(), value)
      })

      it('should increase the total locked gold balance', async () => {
        assert.equal(await lockedGold.getTotalLockedGold(), value)
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
        const pendingWithdrawals = await lockedGold.getPendingWithdrawals(account)
        assert.equal(pendingWithdrawals.length, 0)
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
    let availabilityTime: BigNumber
    let resp: any
    describe('when a pending withdrawal exists', () => {
      before(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await lockedGold.lock({ value })
        resp = await lockedGold.unlock(value)
        availabilityTime = new BigNumber(unlockingPeriod).plus(
          (await web3.eth.getBlock('latest')).timestamp
        )
      })

      describe('when it is after the availablity time', () => {
        before(async () => {
          await timeTravel(web3, unlockingPeriod)
          resp = await lockedGold.withdraw(index)
        })

        it('should remove the pending withdrawal', async () => {
          const pendingWithdrawals = await lockedGold.getPendingWithdrawals(account)
          assert.equal(pendingWithdrawals.length, 0)
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
