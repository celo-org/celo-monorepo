import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertEqualBNArray,
  assertRevert,
  assertSameAddress,
  NULL_ADDRESS,
  mineBlocks,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockElectionContract,
  MockElectionInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryContract,
  RegistryInstance,
  ValidatorsTestContract,
  ValidatorsTestInstance,
} from 'types'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'

const Validators: ValidatorsTestContract = artifacts.require('ValidatorsTest')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Validators.numberFormat = 'BigNumber'

const parseValidatorParams = (validatorParams: any) => {
  return {
    name: validatorParams[0],
    publicKeysData: validatorParams[1],
    affiliation: validatorParams[2],
    score: validatorParams[3],
  }
}

const parseValidatorGroupParams = (groupParams: any) => {
  return {
    name: groupParams[0],
    members: groupParams[1],
    commission: groupParams[2],
  }
}

const HOUR = 60 * 60
const DAY = 24 * HOUR
// Hard coded in ganache.
const EPOCH = 100

// TODO(asa): Test epoch payment distribution
contract('Validators', (accounts: string[]) => {
  let validators: ValidatorsTestInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let mockElection: MockElectionInstance
  const nonOwner = accounts[1]

  const balanceRequirements = { group: new BigNumber(1000), validator: new BigNumber(100) }
  const deregistrationLockups = {
    group: new BigNumber(100 * DAY),
    validator: new BigNumber(60 * DAY),
  }
  const validatorScoreParameters = {
    exponent: new BigNumber(5),
    adjustmentSpeed: toFixed(0.25),
  }
  const validatorEpochPayment = new BigNumber(10000000000000)
  const membershipHistoryLength = new BigNumber(3)
  const maxGroupSize = new BigNumber(5)

  // A random 64 byte hex string.
  const publicKey =
    'ea0733ad275e2b9e05541341a97ee82678c58932464fad26164657a111a7e37a9fa0300266fb90e2135a1f1512350cb4e985488a88809b14e3cbe415e76e82b2'
  const blsPublicKey =
    '4d23d8cd06f30b1fa7cf368e2f5399ab04bb6846c682f493a98a607d3dfb7e53a712bb79b475c57b0ac2785460f91301'
  const blsPoP =
    '9d3e1d8f49f6b0d8e9a03d80ca07b1d24cf1cc0557bdcc04f5e17a46e35d02d0d411d956dbd5d2d2464eebd7b74ae30005d223780d785d2abc5644fac7ac29fb0e302bdc80c81a5d45018b68b1045068a4b3a4861c93037685fd0d252d740501'
  const publicKeysData = '0x' + publicKey + blsPublicKey + blsPoP
  const name = 'test-name'
  const commission = toFixed(1 / 100)
  beforeEach(async () => {
    validators = await Validators.new()
    mockLockedGold = await MockLockedGold.new()
    mockElection = await MockElection.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await validators.initialize(
      registry.address,
      balanceRequirements.group,
      balanceRequirements.validator,
      deregistrationLockups.group,
      deregistrationLockups.validator,
      validatorScoreParameters.exponent,
      validatorScoreParameters.adjustmentSpeed,
      validatorEpochPayment,
      membershipHistoryLength,
      maxGroupSize
    )
  })

  const registerValidator = async (validator: string) => {
    await mockLockedGold.setAccountTotalLockedGold(validator, balanceRequirements.validator)
    await validators.registerValidator(
      name,
      // @ts-ignore bytes type
      publicKeysData,
      { from: validator }
    )
  }

  const registerValidatorGroup = async (group: string) => {
    await mockLockedGold.setAccountTotalLockedGold(group, balanceRequirements.group)
    await validators.registerValidatorGroup(name, commission, { from: group })
  }

  const registerValidatorGroupWithMembers = async (group: string, members: string[]) => {
    await registerValidatorGroup(group)
    for (const validator of members) {
      await registerValidator(validator)
      await validators.affiliate(group, { from: validator })
      if (validator == members[0]) {
        await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
      } else {
        await validators.addMember(validator, { from: group })
      }
    }
  }

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await validators.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set the balance requirements', async () => {
      const [group, validator] = await validators.getBalanceRequirements()
      assertEqualBN(group, balanceRequirements.group)
      assertEqualBN(validator, balanceRequirements.validator)
    })

    it('should have set the deregistration lockups', async () => {
      const [group, validator] = await validators.getDeregistrationLockups()
      assertEqualBN(group, deregistrationLockups.group)
      assertEqualBN(validator, deregistrationLockups.validator)
    })

    it('should have set the validator score parameters', async () => {
      const [exponent, adjustmentSpeed] = await validators.getValidatorScoreParameters()
      assertEqualBN(exponent, validatorScoreParameters.exponent)
      assertEqualBN(adjustmentSpeed, validatorScoreParameters.adjustmentSpeed)
    })

    it('should have set the validator epoch payment', async () => {
      const actual = await validators.validatorEpochPayment()
      assertEqualBN(actual, validatorEpochPayment)
    })

    it('should have set the membership history length', async () => {
      const actual = await validators.membershipHistoryLength()
      assertEqualBN(actual, membershipHistoryLength)
    })

    it('should have set the max group size', async () => {
      const actualMaxGroupSize = await validators.getMaxGroupSize()
      assertEqualBN(actualMaxGroupSize, maxGroupSize)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        validators.initialize(
          registry.address,
          balanceRequirements.group,
          balanceRequirements.validator,
          deregistrationLockups.group,
          deregistrationLockups.validator,
          validatorScoreParameters.exponent,
          validatorScoreParameters.adjustmentSpeed,
          validatorEpochPayment,
          membershipHistoryLength,
          maxGroupSize
        )
      )
    })
  })

  describe('#setValidatorEpochPayment()', () => {
    describe('when the payment is different', () => {
      const newPayment = validatorEpochPayment.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setValidatorEpochPayment(newPayment)
        })

        it('should set the validator epoch payment', async () => {
          assertEqualBN(await validators.validatorEpochPayment(), newPayment)
        })

        it('should emit the ValidatorEpochPaymentSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorEpochPaymentSet',
            args: {
              value: new BigNumber(newPayment),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setValidatorEpochPayment(newPayment, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the payment is the same', () => {
        it('should revert', async () => {
          await assertRevert(validators.setValidatorEpochPayment(validatorEpochPayment))
        })
      })
    })
  })

  describe('#setMembershipHistoryLength()', () => {
    describe('when the length is different', () => {
      const newLength = membershipHistoryLength.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setMembershipHistoryLength(newLength)
        })

        it('should set the membership history length', async () => {
          assertEqualBN(await validators.membershipHistoryLength(), newLength)
        })

        it('should emit the MembershipHistoryLengthSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'MembershipHistoryLengthSet',
            args: {
              length: new BigNumber(newLength),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setMembershipHistoryLength(newLength, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the length is the same', () => {
        it('should revert', async () => {
          await assertRevert(validators.setMembershipHistoryLength(membershipHistoryLength))
        })
      })
    })
  })

  describe('#setMaxGroupSize()', () => {
    describe('when the group size is different', () => {
      const newSize = maxGroupSize.plus(1)

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setMaxGroupSize(newSize)
        })

        it('should set the max group size', async () => {
          assertEqualBN(await validators.maxGroupSize(), newSize)
        })

        it('should emit the MaxGroupSizeSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'MaxGroupSizeSet',
            args: {
              size: new BigNumber(newSize),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setMaxGroupSize(newSize, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the size is the same', () => {
        it('should revert', async () => {
          await assertRevert(validators.setMaxGroupSize(maxGroupSize))
        })
      })
    })
  })

  describe('#setBalanceRequirements()', () => {
    describe('when the requirements are different', () => {
      const newRequirements = {
        group: balanceRequirements.group.plus(1),
        validator: balanceRequirements.validator.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setBalanceRequirements(
            newRequirements.group,
            newRequirements.validator
          )
        })

        it('should set the group and validator requirements', async () => {
          const [group, validator] = await validators.getBalanceRequirements()
          assertEqualBN(group, newRequirements.group)
          assertEqualBN(validator, newRequirements.validator)
        })

        it('should emit the BalanceRequirementsSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'BalanceRequirementsSet',
            args: {
              group: new BigNumber(newRequirements.group),
              validator: new BigNumber(newRequirements.validator),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setBalanceRequirements(newRequirements.group, newRequirements.validator, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the requirements are the same', () => {
        it('should revert', async () => {
          await assertRevert(
            validators.setBalanceRequirements(
              balanceRequirements.group,
              balanceRequirements.validator
            )
          )
        })
      })
    })
  })

  describe('#setDeregistrationLockups()', () => {
    describe('when the lockups are different', () => {
      const newLockups = {
        group: deregistrationLockups.group.plus(1),
        validator: deregistrationLockups.validator.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setDeregistrationLockups(newLockups.group, newLockups.validator)
        })

        it('should set the group and validator lockups', async () => {
          const [group, validator] = await validators.getDeregistrationLockups()
          assertEqualBN(group, newLockups.group)
          assertEqualBN(validator, newLockups.validator)
        })

        it('should emit the DeregistrationLockupsSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'DeregistrationLockupsSet',
            args: {
              group: new BigNumber(newLockups.group),
              validator: new BigNumber(newLockups.validator),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setDeregistrationLockups(newLockups.group, newLockups.validator, {
                from: nonOwner,
              })
            )
          })
        })
      })

      describe('when the lockups are the same', () => {
        it('should revert', async () => {
          await assertRevert(
            validators.setDeregistrationLockups(
              deregistrationLockups.group,
              deregistrationLockups.validator
            )
          )
        })
      })
    })
  })

  describe('#setValidatorScoreParameters()', () => {
    describe('when the parameters are different', () => {
      const newParameters = {
        exponent: validatorScoreParameters.exponent.plus(1),
        adjustmentSpeed: validatorScoreParameters.adjustmentSpeed.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setValidatorScoreParameters(
            newParameters.exponent,
            newParameters.adjustmentSpeed
          )
        })

        it('should set the exponent and adjustment speed', async () => {
          const [exponent, adjustmentSpeed] = await validators.getValidatorScoreParameters()
          assertEqualBN(exponent, newParameters.exponent)
          assertEqualBN(adjustmentSpeed, newParameters.adjustmentSpeed)
        })

        it('should emit the ValidatorScoreParametersSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorScoreParametersSet',
            args: {
              exponent: new BigNumber(newParameters.exponent),
              adjustmentSpeed: new BigNumber(newParameters.adjustmentSpeed),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setValidatorScoreParameters(
                newParameters.exponent,
                newParameters.adjustmentSpeed,
                {
                  from: nonOwner,
                }
              )
            )
          })
        })
      })

      describe('when the requirements are the same', () => {
        it('should revert', async () => {
          await assertRevert(
            validators.setValidatorScoreParameters(
              validatorScoreParameters.exponent,
              validatorScoreParameters.adjustmentSpeed
            )
          )
        })
      })
    })
  })

  describe('#setMaxGroupSize()', () => {
    describe('when the size is different', () => {
      describe('when called by the owner', () => {
        let resp: any
        const newSize = maxGroupSize.plus(1)

        beforeEach(async () => {
          resp = await validators.setMaxGroupSize(newSize)
        })

        it('should set the max group size', async () => {
          const size = await validators.getMaxGroupSize()
          assertEqualBN(size, newSize)
        })

        it('should emit the MaxGroupSizeSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'MaxGroupSizeSet',
            args: {
              size: new BigNumber(newSize),
            },
          })
        })
      })

      describe('when the size is the same', () => {
        it('should revert', async () => {
          await assertRevert(validators.setMaxGroupSize(maxGroupSize))
        })
      })
    })

    describe('when called by a non-owner', () => {
      it('should revert', async () => {
        await assertRevert(validators.setMaxGroupSize(maxGroupSize, { from: nonOwner }))
      })
    })
  })

  describe('#registerValidator', () => {
    const validator = accounts[0]
    let resp: any
    describe('when the account is not a registered validator', () => {
      let validatorRegistrationEpochNumber: number
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(validator, balanceRequirements.validator)
        resp = await validators.registerValidator(
          name,
          // @ts-ignore bytes type
          publicKeysData
        )
        const blockNumber = (await web3.eth.getBlock('latest')).number
        validatorRegistrationEpochNumber = Math.floor(blockNumber / EPOCH)
      })

      it('should mark the account as a validator', async () => {
        assert.isTrue(await validators.isValidator(validator))
      })

      it('should add the account to the list of validators', async () => {
        assert.deepEqual(await validators.getRegisteredValidators(), [validator])
      })

      it('should set the validator name and public key', async () => {
        const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
        assert.equal(parsedValidator.name, name)
        assert.equal(parsedValidator.publicKeysData, publicKeysData)
      })

      it('should set account balance requirements', async () => {
        const requirement = await validators.getAccountBalanceRequirement(validator)
        assertEqualBN(requirement, balanceRequirements.validator)
      })

      it('should set the validator membership history', async () => {
        const membershipHistory = await validators.getMembershipHistory(validator)
        assertEqualBNArray(membershipHistory[0], [validatorRegistrationEpochNumber])
        assert.deepEqual(membershipHistory[1], [NULL_ADDRESS])
      })

      it('should emit the ValidatorRegistered event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorRegistered',
          args: {
            validator,
            name,
            publicKeysData,
          },
        })
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(validator, balanceRequirements.validator)
        await validators.registerValidator(
          name,
          // @ts-ignore bytes type
          publicKeysData
        )
        assert.deepEqual(await validators.getRegisteredValidators(), [validator])
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(validator, balanceRequirements.group)
        await validators.registerValidatorGroup(name, commission)
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            name,
            // @ts-ignore bytes type
            publicKeysData
          )
        )
      })
    })

    describe('when the account does not meet the balance requirements', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          validator,
          balanceRequirements.validator.minus(1)
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            name,
            // @ts-ignore bytes type
            publicKeysData
          )
        )
      })
    })
  })

  describe('#deregisterValidator', () => {
    const validator = accounts[0]
    const index = 0
    let resp: any
    describe('when the account is a registered validator', () => {
      beforeEach(async () => {
        await registerValidator(validator)
        resp = await validators.deregisterValidator(index)
      })

      it('should mark the account as not a validator', async () => {
        assert.isFalse(await validators.isValidator(validator))
      })

      it('should remove the account from the list of validators', async () => {
        assert.deepEqual(await validators.getRegisteredValidators(), [])
      })

      it('should preserve account balance requirements', async () => {
        const requirement = await validators.getAccountBalanceRequirement(validator)
        assertEqualBN(requirement, balanceRequirements.validator)
      })

      it('should set the validator deregistration timestamp', async () => {
        const latestTimestamp = (await web3.eth.getBlock('latest')).timestamp
        const [groupTimestamp, validatorTimestamp] = await validators.getDeregistrationTimestamps(
          validator
        )
        assertEqualBN(groupTimestamp, 0)
        assertEqualBN(validatorTimestamp, latestTimestamp)
      })

      it('should emit the ValidatorDeregistered event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorDeregistered',
          args: {
            validator,
          },
        })
      })
    })

    describe('when the validator is affiliated with a validator group', () => {
      const group = accounts[1]
      beforeEach(async () => {
        await registerValidator(validator)
        await registerValidatorGroup(group)
        await validators.affiliate(group)
      })

      it('should emit the ValidatorDeafilliated event', async () => {
        const resp = await validators.deregisterValidator(index)
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorDeaffiliated',
          args: {
            validator,
            group,
          },
        })
      })

      describe('when the validator is a member of that group', () => {
        beforeEach(async () => {
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
        })

        it('should remove the validator from the group membership list', async () => {
          await validators.deregisterValidator(index)
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assert.deepEqual(parsedGroup.members, [])
        })

        it('should emit the ValidatorGroupMemberRemoved event', async () => {
          const resp = await validators.deregisterValidator(index)
          assert.equal(resp.logs.length, 3)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupMemberRemoved',
            args: {
              validator,
              group,
            },
          })
        })

        describe('when the validator is the only member of that group', () => {
          it('should should mark the group as ineligible for election', async () => {
            await validators.deregisterValidator(index)
            assert.isTrue(await mockElection.isIneligible(group))
          })
        })
      })
    })

    it('should revert when the account is not a registered validator', async () => {
      await assertRevert(validators.deregisterValidator(index, { from: accounts[2] }))
    })

    it('should revert when the wrong index is provided', async () => {
      await assertRevert(validators.deregisterValidator(index + 1))
    })
  })

  describe('#affiliate', () => {
    const validator = accounts[0]
    const group = accounts[1]
    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
    })

    it('should set the affiliate', async () => {
      await validators.affiliate(group)
      const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
      assert.equal(parsedValidator.affiliation, group)
    })

    it('should emit the ValidatorAffiliated event', async () => {
      const resp = await validators.affiliate(group)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorAffiliated',
        args: {
          validator,
          group,
        },
      })
    })

    describe('when the validator is already affiliated with a validator group', () => {
      const otherGroup = accounts[2]
      beforeEach(async () => {
        await validators.affiliate(group)
        await registerValidatorGroup(otherGroup)
      })

      it('should set the affiliate', async () => {
        await validators.affiliate(otherGroup)
        const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
        assert.equal(parsedValidator.affiliation, otherGroup)
      })

      it('should emit the ValidatorDeafilliated event', async () => {
        const resp = await validators.affiliate(otherGroup)
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorDeaffiliated',
          args: {
            validator,
            group,
          },
        })
      })

      it('should emit the ValidatorAffiliated event', async () => {
        const resp = await validators.affiliate(otherGroup)
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[1]
        assertContainSubset(log, {
          event: 'ValidatorAffiliated',
          args: {
            validator,
            group: otherGroup,
          },
        })
      })

      describe('when the validator is a member of that group', () => {
        beforeEach(async () => {
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
        })

        it('should remove the validator from the group membership list', async () => {
          await validators.affiliate(otherGroup)
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assert.deepEqual(parsedGroup.members, [])
        })

        it('should emit the ValidatorGroupMemberRemoved event', async () => {
          const resp = await validators.affiliate(otherGroup)
          assert.equal(resp.logs.length, 3)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupMemberRemoved',
            args: {
              validator,
              group,
            },
          })
        })

        describe('when the validator is the only member of that group', () => {
          it('should should mark the group as ineligible for election', async () => {
            await validators.affiliate(otherGroup)
            assert.isTrue(await mockElection.isIneligible(group))
          })
        })
      })
    })

    it('should revert when the account is not a registered validator', async () => {
      await assertRevert(validators.affiliate(group, { from: accounts[2] }))
    })

    it('should revert when the group is not a registered validator group', async () => {
      await assertRevert(validators.affiliate(accounts[2]))
    })
  })

  describe('#deaffiliate', () => {
    const validator = accounts[0]
    const group = accounts[1]
    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
      await validators.affiliate(group)
    })

    it('should clear the affiliate', async () => {
      await validators.deaffiliate()
      const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
      assert.equal(parsedValidator.affiliation, NULL_ADDRESS)
    })

    it('should emit the ValidatorDeaffiliated event', async () => {
      const resp = await validators.deaffiliate()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorDeaffiliated',
        args: {
          validator,
          group,
        },
      })
    })

    describe('when the validator is a member of the affiliated group', () => {
      beforeEach(async () => {
        await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
      })

      it('should remove the validator from the group membership list', async () => {
        await validators.deaffiliate()
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert.deepEqual(parsedGroup.members, [])
      })

      it("should update the member's membership history", async () => {
        await validators.deaffiliate()
        const membershipHistory = await validators.getMembershipHistory(validator)
        const expectedEpoch = new BigNumber(
          Math.floor((await web3.eth.getBlock('latest')).number / EPOCH)
        )
        assert.equal(membershipHistory[0].length, 1)
        assertEqualBN(membershipHistory[0][0], expectedEpoch)
        assert.equal(membershipHistory[1].length, 1)
        assertSameAddress(membershipHistory[1][0], NULL_ADDRESS)
      })

      it('should emit the ValidatorGroupMemberRemoved event', async () => {
        const resp = await validators.deaffiliate()
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorGroupMemberRemoved',
          args: {
            validator,
            group,
          },
        })
      })

      describe('when the validator is the only member of that group', () => {
        it('should should mark the group as ineligible for election', async () => {
          await validators.deaffiliate()
          assert.isTrue(await mockElection.isIneligible(group))
        })
      })
    })

    it('should revert when the account is not a registered validator', async () => {
      await assertRevert(validators.deaffiliate({ from: accounts[2] }))
    })

    it('should revert when the validator is not affiliated with a validator group', async () => {
      await validators.deaffiliate()
      await assertRevert(validators.deaffiliate())
    })
  })

  describe('#registerValidatorGroup', () => {
    const group = accounts[0]
    let resp: any
    describe('when the account is not a registered validator group', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(group, balanceRequirements.group)
        resp = await validators.registerValidatorGroup(name, commission)
      })

      it('should mark the account as a validator group', async () => {
        assert.isTrue(await validators.isValidatorGroup(group))
      })

      it('should add the account to the list of validator groups', async () => {
        assert.deepEqual(await validators.getRegisteredValidatorGroups(), [group])
      })

      it('should set the validator group name and commission', async () => {
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert.equal(parsedGroup.name, name)
        assertEqualBN(parsedGroup.commission, commission)
      })

      it('should set account balance requirements', async () => {
        const requirement = await validators.getAccountBalanceRequirement(group)
        assertEqualBN(requirement, balanceRequirements.group)
      })

      it('should emit the ValidatorGroupRegistered event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorGroupRegistered',
          args: {
            group,
            name,
          },
        })
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await registerValidator(group)
      })

      it('should revert', async () => {
        await assertRevert(validators.registerValidatorGroup(name, commission))
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(group, balanceRequirements.group)
        await validators.registerValidatorGroup(name, commission)
      })

      it('should revert', async () => {
        await assertRevert(validators.registerValidatorGroup(name, commission))
      })
    })

    describe('when the account does not meet the balance requirements', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(group, balanceRequirements.group.minus(1))
      })

      it('should revert', async () => {
        await assertRevert(validators.registerValidatorGroup(name, commission))
      })
    })
  })

  describe('#deregisterValidatorGroup', () => {
    const index = 0
    const group = accounts[0]
    let resp: any
    beforeEach(async () => {
      await registerValidatorGroup(group)
      resp = await validators.deregisterValidatorGroup(index)
    })

    it('should mark the account as not a validator group', async () => {
      assert.isFalse(await validators.isValidatorGroup(group))
    })

    it('should remove the account from the list of validator groups', async () => {
      assert.deepEqual(await validators.getRegisteredValidatorGroups(), [])
    })

    it('should preserve account balance requirements', async () => {
      const requirement = await validators.getAccountBalanceRequirement(group)
      assertEqualBN(requirement, balanceRequirements.group)
    })

    it('should set the group deregistration timestamp', async () => {
      const latestTimestamp = (await web3.eth.getBlock('latest')).timestamp
      const [groupTimestamp, validatorTimestamp] = await validators.getDeregistrationTimestamps(
        group
      )
      assertEqualBN(groupTimestamp, latestTimestamp)
      assertEqualBN(validatorTimestamp, 0)
    })

    it('should emit the ValidatorGroupDeregistered event', async () => {
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupDeregistered',
        args: {
          group,
        },
      })
    })

    it('should revert when the account is not a registered validator group', async () => {
      await assertRevert(validators.deregisterValidatorGroup(index, { from: accounts[2] }))
    })

    it('should revert when the wrong index is provided', async () => {
      await assertRevert(validators.deregisterValidatorGroup(index + 1))
    })

    describe('when the validator group is not empty', () => {
      const validator = accounts[1]
      beforeEach(async () => {
        await registerValidatorGroup(group)
        await registerValidator(validator)
        await validators.affiliate(group, { from: validator })
        await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS)
      })

      it('should revert', async () => {
        await assertRevert(validators.deregisterValidatorGroup(index))
      })
    })
  })

  describe('#addMember', () => {
    const group = accounts[0]
    const validator = accounts[1]
    let resp: any
    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
      await validators.affiliate(group, { from: validator })
      resp = await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS)
    })

    it('should add the member to the list of members', async () => {
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.deepEqual(parsedGroup.members, [validator])
    })

    it("should update the member's membership history", async () => {
      const membershipHistory = await validators.getMembershipHistory(validator)
      const expectedEpoch = new BigNumber(
        Math.floor((await web3.eth.getBlock('latest')).number / EPOCH)
      )
      assert.equal(membershipHistory[0].length, 1)
      assertEqualBN(membershipHistory[0][0], expectedEpoch)
      assert.equal(membershipHistory[1].length, 1)
      assertSameAddress(membershipHistory[1][0], group)
    })

    it('should emit the ValidatorGroupMemberAdded event', async () => {
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupMemberAdded',
        args: {
          group,
          validator,
        },
      })
    })

    it('should revert when the account is not a registered validator group', async () => {
      await assertRevert(
        validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: accounts[2] })
      )
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertRevert(validators.addFirstMember(accounts[2], NULL_ADDRESS, NULL_ADDRESS))
    })

    it('should revert when trying to add too many members to group', async () => {
      await validators.setMaxGroupSize(1)
      await registerValidator(accounts[2])
      await validators.affiliate(group, { from: accounts[2] })
      await assertRevert(validators.addMember(accounts[2]))
    })

    describe('when the validator has not affiliated themselves with the group', () => {
      beforeEach(async () => {
        await validators.deaffiliate({ from: validator })
      })

      it('should revert', async () => {
        await assertRevert(validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS))
      })
    })

    describe('when the validator is already a member of the group', () => {
      it('should revert', async () => {
        await assertRevert(validators.addMember(validator))
      })
    })
  })

  describe('#removeMember', () => {
    const group = accounts[0]
    const validator = accounts[1]
    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group, [validator])
    })

    it('should remove the member from the list of members', async () => {
      await validators.removeMember(validator)
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.deepEqual(parsedGroup.members, [])
    })

    it("should update the member's membership history", async () => {
      await validators.removeMember(validator)
      const membershipHistory = await validators.getMembershipHistory(validator)
      const expectedEpoch = new BigNumber(
        Math.floor((await web3.eth.getBlock('latest')).number / EPOCH)
      )

      // Depending on test timing, we may or may not span an epoch boundary between registration
      // and removal.
      const numEntries = membershipHistory[0].length
      assert.isTrue(numEntries == 1 || numEntries == 2)
      assert.equal(membershipHistory[1].length, numEntries)
      if (numEntries == 1) {
        assertEqualBN(membershipHistory[0][0], expectedEpoch)
        assertSameAddress(membershipHistory[1][0], NULL_ADDRESS)
      } else {
        assertEqualBN(membershipHistory[0][1], expectedEpoch)
        assertSameAddress(membershipHistory[1][1], NULL_ADDRESS)
      }
    })

    it('should emit the ValidatorGroupMemberRemoved event', async () => {
      const resp = await validators.removeMember(validator)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupMemberRemoved',
        args: {
          group,
          validator,
        },
      })
    })

    describe('when the validator is the only member of the group', () => {
      it('should mark the group ineligible', async () => {
        await validators.removeMember(validator)
        assert.isTrue(await mockElection.isIneligible(group))
      })
    })

    it('should revert when the account is not a registered validator group', async () => {
      await assertRevert(validators.removeMember(validator, { from: accounts[2] }))
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertRevert(validators.removeMember(accounts[2]))
    })

    describe('when the validator is not a member of the validator group', () => {
      beforeEach(async () => {
        await validators.deaffiliate({ from: validator })
      })

      it('should revert', async () => {
        await assertRevert(validators.removeMember(validator))
      })
    })
  })

  describe('#reorderMember', () => {
    const group = accounts[0]
    const validator1 = accounts[1]
    const validator2 = accounts[2]
    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group, [validator1, validator2])
    })

    it('should reorder the list of group members', async () => {
      await validators.reorderMember(validator2, validator1, NULL_ADDRESS)
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.deepEqual(parsedGroup.members, [validator2, validator1])
    })

    it('should emit the ValidatorGroupMemberReordered event', async () => {
      const resp = await validators.reorderMember(validator2, validator1, NULL_ADDRESS)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupMemberReordered',
        args: {
          group,
          validator: validator2,
        },
      })
    })

    it('should revert when the account is not a registered validator group', async () => {
      await assertRevert(
        validators.reorderMember(validator2, validator1, NULL_ADDRESS, { from: accounts[2] })
      )
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertRevert(validators.reorderMember(accounts[3], validator1, NULL_ADDRESS))
    })

    describe('when the validator is not a member of the validator group', () => {
      beforeEach(async () => {
        await validators.deaffiliate({ from: validator2 })
      })

      it('should revert', async () => {
        await assertRevert(validators.reorderMember(validator2, validator1, NULL_ADDRESS))
      })
    })
  })

  describe('#updateValidatorScore', () => {
    const validator = accounts[0]
    beforeEach(async () => {
      await registerValidator(validator)
    })

    describe('when 0 <= uptime <= 1.0', () => {
      const uptime = new BigNumber(0.99)
      // @ts-ignore
      const epochScore = uptime.pow(validatorScoreParameters.exponent)
      const adjustmentSpeed = fromFixed(validatorScoreParameters.adjustmentSpeed)
      beforeEach(async () => {
        await validators.updateValidatorScore(validator, toFixed(uptime))
      })

      it('should update the validator score', async () => {
        const expectedScore = adjustmentSpeed.times(epochScore)
        const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
        assertEqualBN(parsedValidator.score, toFixed(expectedScore))
      })

      describe('when the validator already has a non-zero score', () => {
        beforeEach(async () => {
          await validators.updateValidatorScore(validator, toFixed(uptime))
        })

        it('should update the validator score', async () => {
          let expectedScore = adjustmentSpeed.times(epochScore)
          expectedScore = new BigNumber(1)
            .minus(adjustmentSpeed)
            .times(expectedScore)
            .plus(expectedScore)
          const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
          assertEqualBN(parsedValidator.score, toFixed(expectedScore))
        })
      })
    })

    describe('when uptime > 1.0', () => {
      const uptime = 1.01
      it('should revert', async () => {
        await assertRevert(validators.updateValidatorScore(validator, toFixed(uptime)))
      })
    })
  })

  describe('#updateMembershipHistory', () => {
    const validator = accounts[0]
    const groups = accounts.slice(1)
    let validatorRegistrationEpochNumber: number
    beforeEach(async () => {
      await registerValidator(validator)
      const blockNumber = (await web3.eth.getBlock('latest')).number
      validatorRegistrationEpochNumber = Math.floor(blockNumber / EPOCH)
      for (const group of groups) {
        await registerValidatorGroup(group)
      }
    })

    describe('when changing groups in the same epoch', () => {
      it('should overwrite the previous entry', async () => {
        const numTests = 10
        // We store an entry upon registering the validator.
        const expectedMembershipHistoryGroups = [NULL_ADDRESS]
        const expectedMembershipHistoryEpochs = [new BigNumber(validatorRegistrationEpochNumber)]
        for (let i = 0; i < numTests; i++) {
          const blockNumber = (await web3.eth.getBlock('latest')).number
          const epochNumber = Math.floor(blockNumber / EPOCH)
          const blocksUntilNextEpoch = (epochNumber + 1) * EPOCH - blockNumber
          await mineBlocks(blocksUntilNextEpoch, web3)

          let group = groups[0]
          await validators.affiliate(group)
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: group,
          })
          let membershipHistory = await validators.getMembershipHistory(validator)
          expectedMembershipHistoryGroups.push(group)
          expectedMembershipHistoryEpochs.push(new BigNumber(epochNumber + 1))
          if (expectedMembershipHistoryGroups.length > membershipHistoryLength.toNumber()) {
            expectedMembershipHistoryGroups.shift()
            expectedMembershipHistoryEpochs.shift()
          }
          assertEqualBNArray(membershipHistory[0], expectedMembershipHistoryEpochs)
          assert.deepEqual(membershipHistory[1], expectedMembershipHistoryGroups)

          group = groups[1]
          await validators.affiliate(group)
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: group,
          })
          membershipHistory = await validators.getMembershipHistory(validator)
          expectedMembershipHistoryGroups[expectedMembershipHistoryGroups.length - 1] = group
          assertEqualBNArray(membershipHistory[0], expectedMembershipHistoryEpochs)
          assert.deepEqual(membershipHistory[1], expectedMembershipHistoryGroups)
        }
      })
    })

    describe('when changing groups more times than membership history length', () => {
      it('should always store the most recent memberships', async () => {
        // We store an entry upon registering the validator.
        const expectedMembershipHistoryGroups = [NULL_ADDRESS]
        const expectedMembershipHistoryEpochs = [new BigNumber(validatorRegistrationEpochNumber)]
        for (let i = 0; i < membershipHistoryLength.plus(1).toNumber(); i++) {
          const blockNumber = (await web3.eth.getBlock('latest')).number
          const epochNumber = Math.floor(blockNumber / EPOCH)
          const blocksUntilNextEpoch = (epochNumber + 1) * EPOCH - blockNumber
          await mineBlocks(blocksUntilNextEpoch, web3)

          await validators.affiliate(groups[i])
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: groups[i],
          })
          expectedMembershipHistoryGroups.push(groups[i])
          expectedMembershipHistoryEpochs.push(new BigNumber(epochNumber + 1))
          if (expectedMembershipHistoryGroups.length > membershipHistoryLength.toNumber()) {
            expectedMembershipHistoryGroups.shift()
            expectedMembershipHistoryEpochs.shift()
          }
          const membershipHistory = await validators.getMembershipHistory(validator)
          assertEqualBNArray(membershipHistory[0], expectedMembershipHistoryEpochs)
          assert.deepEqual(membershipHistory[1], expectedMembershipHistoryGroups)
        }
      })
    })
  })

  describe('#getMembershipInLastEpoch', () => {
    const validator = accounts[0]
    const groups = accounts.slice(1)
    beforeEach(async () => {
      await registerValidator(validator)
      for (const group of groups) {
        await registerValidatorGroup(group)
      }
    })

    describe('when changing groups more times than membership history length', () => {
      it('should always return the correct membership for the last epoch', async () => {
        for (let i = 0; i < membershipHistoryLength.plus(1).toNumber(); i++) {
          const blockNumber = (await web3.eth.getBlock('latest')).number
          const epochNumber = Math.floor(blockNumber / EPOCH)
          const blocksUntilNextEpoch = (epochNumber + 1) * EPOCH - blockNumber
          await mineBlocks(blocksUntilNextEpoch, web3)

          await validators.affiliate(groups[i])
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: groups[i],
          })

          if (i == 0) {
            assert.equal(await validators.getMembershipInLastEpoch(validator), NULL_ADDRESS)
          } else {
            assert.equal(await validators.getMembershipInLastEpoch(validator), groups[i - 1])
          }
        }
      })
    })
  })

  describe('#getEpochSize', () => {
    it('should always return 100', async () => {
      assertEqualBN(await validators.getEpochSize(), 100)
    })
  })

  describe('#distributeEpochPayment', () => {
    const validator = accounts[0]
    const group = accounts[1]
    let mockStableToken: MockStableTokenInstance
    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group, [validator])
      mockStableToken = await MockStableToken.new()
      await registry.setAddressFor(CeloContractName.StableToken, mockStableToken.address)
    })

    describe('when the validator score is non-zero', () => {
      const uptime = new BigNumber(0.99)
      const adjustmentSpeed = fromFixed(validatorScoreParameters.adjustmentSpeed)
      // @ts-ignore
      const expectedScore = adjustmentSpeed.times(uptime.pow(validatorScoreParameters.exponent))
      const expectedTotalPayment = expectedScore.times(validatorEpochPayment)
      const expectedGroupPayment = expectedTotalPayment
        .times(fromFixed(commission))
        .dp(0, BigNumber.ROUND_FLOOR)
      const expectedValidatorPayment = expectedTotalPayment.minus(expectedGroupPayment)
      beforeEach(async () => {
        await validators.updateValidatorScore(validator, toFixed(uptime))
      })

      describe('when the validator and group meet the balance requirements', () => {
        beforeEach(async () => {
          await validators.distributeEpochPayment(validator)
        })

        it('should pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), expectedValidatorPayment)
        })

        it('should pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), expectedGroupPayment)
        })
      })

      describe('when the validator does not meet the balance requirements', () => {
        beforeEach(async () => {
          await mockLockedGold.setAccountTotalLockedGold(
            validator,
            balanceRequirements.validator.minus(1)
          )
          await validators.distributeEpochPayment(validator)
        })

        it('should not pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), 0)
        })

        it('should not pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), 0)
        })
      })

      describe('when the group does not meet the balance requirements', () => {
        beforeEach(async () => {
          await mockLockedGold.setAccountTotalLockedGold(group, balanceRequirements.group.minus(1))
          await validators.distributeEpochPayment(validator)
        })

        it('should not pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), 0)
        })

        it('should not pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), 0)
        })
      })
    })
  })
})
