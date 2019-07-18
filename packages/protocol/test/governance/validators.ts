import { bondedDepositsRegistryId } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  MockBondedDepositsContract,
  MockBondedDepositsInstance,
  RegistryContract,
  RegistryInstance,
  ValidatorsContract,
  ValidatorsInstance,
} from 'types'

const Validators: ValidatorsContract = artifacts.require('Validators')
const MockBondedDeposits: MockBondedDepositsContract = artifacts.require('MockBondedDeposits')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Validators.numberFormat = 'BigNumber'

const parseValidatorParams = (validatorParams: any) => {
  return {
    identifier: validatorParams[0],
    name: validatorParams[1],
    url: validatorParams[2],
    publicKey: validatorParams[3],
    affiliation: validatorParams[4],
  }
}

const parseValidatorGroupParams = (groupParams: any) => {
  return {
    identifier: groupParams[0],
    name: groupParams[1],
    url: groupParams[2],
    members: groupParams[3],
  }
}

contract('Validators', (accounts: string[]) => {
  let validators: ValidatorsInstance
  let registry: RegistryInstance
  let mockBondedDeposits: MockBondedDepositsInstance
  // A random 64 byte hex string.
  const publicKey =
    '0xea0733ad275e2b9e05541341a97ee82678c58932464fad26164657a111a7e37a9fa0300266fb90e2135a1f1512350cb4e985488a88809b14e3cbe415e76e82b2'
  const nonOwner = accounts[1]
  const minElectableValidators = new BigNumber(4)
  const maxElectableValidators = new BigNumber(6)
  const registrationRequirement = { value: new BigNumber(100), noticePeriod: new BigNumber(60) }
  const identifier = 'test-identifier'
  const name = 'test-name'
  const url = 'test-url'
  beforeEach(async () => {
    validators = await Validators.new()
    mockBondedDeposits = await MockBondedDeposits.new()
    registry = await Registry.new()
    await registry.setAddressFor(bondedDepositsRegistryId, mockBondedDeposits.address)
    await validators.initialize(
      registry.address,
      minElectableValidators,
      maxElectableValidators,
      registrationRequirement.value,
      registrationRequirement.noticePeriod
    )
  })

  const registerValidator = async (validator: string) => {
    await mockBondedDeposits.setBondedDeposit(
      validator,
      registrationRequirement.noticePeriod,
      registrationRequirement.value
    )
    await validators.registerValidator(
      identifier,
      name,
      url,
      // @ts-ignore bytes type
      publicKey,
      registrationRequirement.noticePeriod,
      { from: validator }
    )
  }

  const registerValidatorGroup = async (group: string) => {
    await mockBondedDeposits.setBondedDeposit(
      group,
      registrationRequirement.noticePeriod,
      registrationRequirement.value
    )
    await validators.registerValidatorGroup(
      identifier,
      name,
      url,
      registrationRequirement.noticePeriod,
      { from: group }
    )
  }

  const registerValidatorGroupWithMembers = async (group: string, members: string[]) => {
    await registerValidatorGroup(group)
    for (const validator of members) {
      await registerValidator(validator)
      await validators.affiliate(group, { from: validator })
      await validators.addMember(validator, { from: group })
    }
  }

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await validators.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set minElectableValidators', async () => {
      const actualMinElectableValidators = await validators.minElectableValidators()
      assertEqualBN(actualMinElectableValidators, minElectableValidators)
    })

    it('should have set maxElectableValidators', async () => {
      const actualMaxElectableValidators = await validators.maxElectableValidators()
      assertEqualBN(actualMaxElectableValidators, maxElectableValidators)
    })

    it('should have set the registration requirements', async () => {
      const [value, noticePeriod] = await validators.getRegistrationRequirement()
      assertEqualBN(value, registrationRequirement.value)
      assertEqualBN(noticePeriod, registrationRequirement.noticePeriod)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        validators.initialize(
          registry.address,
          minElectableValidators,
          maxElectableValidators,
          registrationRequirement.value,
          registrationRequirement.noticePeriod
        )
      )
    })
  })

  describe('#setMinElectableValidators', () => {
    const newMinElectableValidators = minElectableValidators.plus(1)
    it('should set the minimum deposit', async () => {
      await validators.setMinElectableValidators(newMinElectableValidators)
      assertEqualBN(await validators.minElectableValidators(), newMinElectableValidators)
    })

    it('should emit the MinElectableValidatorsSet event', async () => {
      const resp = await validators.setMinElectableValidators(newMinElectableValidators)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MinElectableValidatorsSet',
        args: {
          minElectableValidators: new BigNumber(newMinElectableValidators),
        },
      })
    })

    it('should revert when the minElectableValidators is zero', async () => {
      await assertRevert(validators.setMinElectableValidators(0))
    })

    it('should revert when the minElectableValidators is greater than maxElectableValidators', async () => {
      await assertRevert(validators.setMinElectableValidators(maxElectableValidators.plus(1)))
    })

    it('should revert when the minElectableValidators is unchanged', async () => {
      await assertRevert(validators.setMinElectableValidators(minElectableValidators))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        validators.setMinElectableValidators(newMinElectableValidators, { from: nonOwner })
      )
    })
  })

  describe('#setMaxElectableValidators', () => {
    const newMaxElectableValidators = maxElectableValidators.plus(1)
    it('should set the minimum deposit', async () => {
      await validators.setMaxElectableValidators(newMaxElectableValidators)
      assertEqualBN(await validators.maxElectableValidators(), newMaxElectableValidators)
    })

    it('should emit the MaxElectableValidatorsSet event', async () => {
      const resp = await validators.setMaxElectableValidators(newMaxElectableValidators)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MaxElectableValidatorsSet',
        args: {
          maxElectableValidators: new BigNumber(newMaxElectableValidators),
        },
      })
    })

    it('should revert when the maxElectableValidators is less than minElectableValidators', async () => {
      await assertRevert(validators.setMaxElectableValidators(minElectableValidators.minus(1)))
    })

    it('should revert when the maxElectableValidators is unchanged', async () => {
      await assertRevert(validators.setMaxElectableValidators(maxElectableValidators))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        validators.setMaxElectableValidators(newMaxElectableValidators, { from: nonOwner })
      )
    })
  })

  describe('#setRegistrationRequirement', () => {
    const newValue = registrationRequirement.value.plus(1)
    const newNoticePeriod = registrationRequirement.noticePeriod.plus(1)

    it('should set the value and notice period', async () => {
      await validators.setRegistrationRequirement(newValue, newNoticePeriod)
      const [value, noticePeriod] = await validators.getRegistrationRequirement()
      assertEqualBN(value, newValue)
      assertEqualBN(noticePeriod, newNoticePeriod)
    })

    it('should emit the RegistrationRequirementSet event', async () => {
      const resp = await validators.setRegistrationRequirement(newValue, newNoticePeriod)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'RegistrationRequirementSet',
        args: {
          value: new BigNumber(newValue),
          noticePeriod: new BigNumber(newNoticePeriod),
        },
      })
    })

    it('should revert when the requirement is unchanged', async () => {
      await assertRevert(
        validators.setRegistrationRequirement(
          registrationRequirement.value,
          registrationRequirement.noticePeriod
        )
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        validators.setRegistrationRequirement(newValue, newNoticePeriod, { from: nonOwner })
      )
    })
  })

  describe('#registerValidator', () => {
    const validator = accounts[0]
    beforeEach(async () => {
      await mockBondedDeposits.setBondedDeposit(
        validator,
        registrationRequirement.noticePeriod,
        registrationRequirement.value
      )
    })

    it('should mark the account as a validator', async () => {
      await validators.registerValidator(
        identifier,
        name,
        url,
        // @ts-ignore bytes type
        publicKey,
        registrationRequirement.noticePeriod
      )
      assert.isTrue(await validators.isValidator(validator))
    })

    it('should add the account to the list of validators', async () => {
      await validators.registerValidator(
        identifier,
        name,
        url,
        // @ts-ignore bytes type
        publicKey,
        registrationRequirement.noticePeriod
      )
      assert.deepEqual(await validators.getRegisteredValidators(), [validator])
    })

    it('should set the validator identifier, name, url, and public key', async () => {
      await validators.registerValidator(
        identifier,
        name,
        url,
        // @ts-ignore bytes type
        publicKey,
        registrationRequirement.noticePeriod
      )
      const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
      assert.equal(parsedValidator.identifier, identifier)
      assert.equal(parsedValidator.name, name)
      assert.equal(parsedValidator.url, url)
      assert.equal(parsedValidator.publicKey, publicKey)
    })

    it('should emit the ValidatorRegistered event', async () => {
      const resp = await validators.registerValidator(
        identifier,
        name,
        url,
        // @ts-ignore bytes type
        publicKey,
        registrationRequirement.noticePeriod
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorRegistered',
        args: {
          validator,
          identifier,
          name,
          url,
          publicKey,
        },
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await validators.registerValidator(
          identifier,
          name,
          url,
          // @ts-ignore bytes type
          publicKey,
          registrationRequirement.noticePeriod
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            identifier,
            name,
            url,
            // @ts-ignore bytes type
            publicKey,
            registrationRequirement.noticePeriod
          )
        )
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await validators.registerValidatorGroup(
          identifier,
          name,
          url,
          registrationRequirement.noticePeriod
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            identifier,
            name,
            url,
            // @ts-ignore bytes type
            publicKey,
            registrationRequirement.noticePeriod
          )
        )
      })
    })

    describe('when the account does not meet the registration requirements', () => {
      beforeEach(async () => {
        await mockBondedDeposits.setBondedDeposit(
          validator,
          registrationRequirement.noticePeriod,
          registrationRequirement.value.minus(1)
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            identifier,
            name,
            url,
            // @ts-ignore bytes type
            publicKey,
            registrationRequirement.noticePeriod
          )
        )
      })
    })
  })

  describe('#deregisterValidator', () => {
    const validator = accounts[0]
    const index = 0
    beforeEach(async () => {
      await registerValidator(validator)
    })

    it('should mark the account as not a validator', async () => {
      await validators.deregisterValidator(index)
      assert.isFalse(await validators.isValidator(validator))
    })

    it('should remove the account from the list of validators', async () => {
      await validators.deregisterValidator(index)
      assert.deepEqual(await validators.getRegisteredValidators(), [])
    })

    it('should emit the ValidatorDeregistered event', async () => {
      const resp = await validators.deregisterValidator(index)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorDeregistered',
        args: {
          validator,
        },
      })
    })

    describe('when the validator is affiliated with a validator group', () => {
      const group = accounts[1]
      beforeEach(async () => {
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
          await validators.addMember(validator, { from: group })
        })

        it('should remove the validator from the group membership list', async () => {
          await validators.deregisterValidator(index)
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assert.deepEqual(parsedGroup.members, [])
        })

        it('should emit the ValidatorGroupMemberRemoved event', async () => {
          const resp = await validators.deregisterValidator(index)
          assert.equal(resp.logs.length, 4)
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
          it('should emit the ValidatorGroupEmptied event', async () => {
            const resp = await validators.deregisterValidator(index)
            assert.equal(resp.logs.length, 4)
            const log = resp.logs[1]
            assertContainSubset(log, {
              event: 'ValidatorGroupEmptied',
              args: {
                group,
              },
            })
          })

          describe('when that group has received votes', () => {
            beforeEach(async () => {
              const voter = accounts[2]
              const weight = 10
              await mockBondedDeposits.setWeight(voter, weight)
              await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS, { from: voter })
            })

            it('should remove the group from the list of electable groups with votes', async () => {
              await validators.deregisterValidator(index)
              const [groups] = await validators.getValidatorGroupVotes()
              assert.deepEqual(groups, [])
            })
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
          await validators.addMember(validator, { from: group })
        })

        it('should remove the validator from the group membership list', async () => {
          await validators.affiliate(otherGroup)
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assert.deepEqual(parsedGroup.members, [])
        })

        it('should emit the ValidatorGroupMemberRemoved event', async () => {
          const resp = await validators.affiliate(otherGroup)
          assert.equal(resp.logs.length, 4)
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
          it('should emit the ValidatorGroupEmptied event', async () => {
            const resp = await validators.affiliate(otherGroup)
            assert.equal(resp.logs.length, 4)
            const log = resp.logs[1]
            assertContainSubset(log, {
              event: 'ValidatorGroupEmptied',
              args: {
                group,
              },
            })
          })

          describe('when that group has received votes', () => {
            beforeEach(async () => {
              const voter = accounts[2]
              const weight = 10
              await mockBondedDeposits.setWeight(voter, weight)
              await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS, { from: voter })
            })

            it('should remove the group from the list of electable groups with votes', async () => {
              await validators.affiliate(otherGroup)
              const [groups] = await validators.getValidatorGroupVotes()
              assert.deepEqual(groups, [])
            })
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
        await validators.addMember(validator, { from: group })
      })

      it('should remove the validator from the group membership list', async () => {
        await validators.deaffiliate()
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert.deepEqual(parsedGroup.members, [])
      })

      it('should emit the ValidatorGroupMemberRemoved event', async () => {
        const resp = await validators.deaffiliate()
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
        it('should emit the ValidatorGroupEmptied event', async () => {
          const resp = await validators.deaffiliate()
          assert.equal(resp.logs.length, 3)
          const log = resp.logs[1]
          assertContainSubset(log, {
            event: 'ValidatorGroupEmptied',
            args: {
              group,
            },
          })
        })

        describe('when that group has received votes', () => {
          beforeEach(async () => {
            const voter = accounts[2]
            const weight = 10
            await mockBondedDeposits.setWeight(voter, weight)
            await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS, { from: voter })
          })

          it('should remove the group from the list of electable groups with votes', async () => {
            await validators.deaffiliate()
            const [groups] = await validators.getValidatorGroupVotes()
            assert.deepEqual(groups, [])
          })
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
    beforeEach(async () => {
      await mockBondedDeposits.setBondedDeposit(
        group,
        registrationRequirement.noticePeriod,
        registrationRequirement.value
      )
    })

    it('should mark the account as a validator group', async () => {
      await validators.registerValidatorGroup(
        identifier,
        name,
        url,
        registrationRequirement.noticePeriod
      )
      assert.isTrue(await validators.isValidatorGroup(group))
    })

    it('should add the account to the list of validator groups', async () => {
      await validators.registerValidatorGroup(
        identifier,
        name,
        url,
        registrationRequirement.noticePeriod
      )
      assert.deepEqual(await validators.getRegisteredValidatorGroups(), [group])
    })

    it('should set the validator group identifier, name, and url', async () => {
      await validators.registerValidatorGroup(
        identifier,
        name,
        url,
        registrationRequirement.noticePeriod
      )
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.equal(parsedGroup.identifier, identifier)
      assert.equal(parsedGroup.name, name)
      assert.equal(parsedGroup.url, url)
    })

    it('should emit the ValidatorGroupRegistered event', async () => {
      const resp = await validators.registerValidatorGroup(
        identifier,
        name,
        url,
        registrationRequirement.noticePeriod
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupRegistered',
        args: {
          group,
          identifier,
          name,
          url,
        },
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await registerValidator(group)
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidatorGroup(
            identifier,
            name,
            url,
            registrationRequirement.noticePeriod
          )
        )
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await validators.registerValidatorGroup(
          identifier,
          name,
          url,
          registrationRequirement.noticePeriod
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidatorGroup(
            identifier,
            name,
            url,
            registrationRequirement.noticePeriod
          )
        )
      })
    })

    describe('when the account does not meet the registration requirements', () => {
      beforeEach(async () => {
        await mockBondedDeposits.setBondedDeposit(
          group,
          registrationRequirement.noticePeriod,
          registrationRequirement.value.minus(1)
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidatorGroup(
            identifier,
            name,
            url,
            registrationRequirement.noticePeriod
          )
        )
      })
    })
  })

  describe('#deregisterValidatorGroup', () => {
    const index = 0
    const group = accounts[0]
    beforeEach(async () => {
      await registerValidatorGroup(group)
    })

    it('should mark the account as not a validator group', async () => {
      await validators.deregisterValidatorGroup(index)
      assert.isFalse(await validators.isValidatorGroup(group))
    })

    it('should remove the account from the list of validator groups', async () => {
      await validators.deregisterValidatorGroup(index)
      assert.deepEqual(await validators.getRegisteredValidatorGroups(), [])
    })

    it('should emit the ValidatorGroupDeregistered event', async () => {
      const resp = await validators.deregisterValidatorGroup(index)
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
        await registerValidator(validator)
        await validators.affiliate(group, { from: validator })
        await validators.addMember(validator)
      })

      it('should revert', async () => {
        await assertRevert(validators.deregisterValidatorGroup(index))
      })
    })
  })

  describe('#addMember', () => {
    const group = accounts[0]
    const validator = accounts[1]
    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
      await validators.affiliate(group, { from: validator })
    })

    it('should add the member to the list of members', async () => {
      await validators.addMember(validator)
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.deepEqual(parsedGroup.members, [validator])
    })

    it('should emit the ValidatorGroupMemberAdded event', async () => {
      const resp = await validators.addMember(validator)
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
      await assertRevert(validators.addMember(validator, { from: accounts[2] }))
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertRevert(validators.addMember(accounts[2]))
    })

    describe('when the validator has not affiliated themselves with the group', () => {
      beforeEach(async () => {
        await validators.deaffiliate({ from: validator })
      })

      it('should revert', async () => {
        await assertRevert(validators.addMember(validator))
      })
    })

    describe('when the validator is already a member of the group', () => {
      beforeEach(async () => {
        await validators.addMember(validator)
      })

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

    it('should emit the ValidatorGroupMemberRemoved event', async () => {
      const resp = await validators.removeMember(validator)
      assert.equal(resp.logs.length, 2)
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
      it('should emit the ValidatorGroupEmptied event', async () => {
        const resp = await validators.removeMember(validator)
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[1]
        assertContainSubset(log, {
          event: 'ValidatorGroupEmptied',
          args: {
            group,
          },
        })
      })

      describe('when the group has received votes', () => {
        beforeEach(async () => {
          const voter = accounts[2]
          const weight = 10
          await mockBondedDeposits.setWeight(voter, weight)
          await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS, { from: voter })
        })

        it('should remove the group from the list of electable groups with votes', async () => {
          await validators.removeMember(validator)
          const [groups] = await validators.getValidatorGroupVotes()
          assert.deepEqual(groups, [])
        })
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

  describe('#vote', () => {
    const weight = new BigNumber(5)
    const voter = accounts[0]
    const validator = accounts[1]
    const group = accounts[2]
    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group, [validator])
      await mockBondedDeposits.setWeight(voter, weight)
    })

    it("should set the voter's vote", async () => {
      await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
      assert.isTrue(await validators.isVoting(voter))
      assert.equal(await validators.voters(voter), group)
    })

    it('should add the group to the list of those receiving votes', async () => {
      await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
      const [groups] = await validators.getValidatorGroupVotes()
      assert.deepEqual(groups, [group])
    })

    it("should increment the validator group's vote total", async () => {
      await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
      assertEqualBN(await validators.getVotesReceived(group), weight)
    })

    it('should emit the ValidatorGroupVoteCast event', async () => {
      const resp = await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupVoteCast',
        args: {
          account: voter,
          group,
          weight: new BigNumber(weight),
        },
      })
    })

    describe('when the group had not previously received votes', () => {
      it('should add the group to the list of electable groups with votes', async () => {
        await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
        const [groups] = await validators.getValidatorGroupVotes()
        assert.deepEqual(groups, [group])
      })
    })

    it('should revert when the group is not a registered validator group', async () => {
      await assertRevert(validators.vote(accounts[3], NULL_ADDRESS, NULL_ADDRESS))
    })

    describe('when the group is empty', () => {
      beforeEach(async () => {
        await validators.removeMember(validator, { from: group })
      })

      it('should revert', async () => {
        await assertRevert(validators.vote(group, NULL_ADDRESS, NULL_ADDRESS))
      })
    })

    describe('when the account voting is frozen', () => {
      beforeEach(async () => {
        await mockBondedDeposits.setVotingFrozen(voter)
      })

      it('should revert', async () => {
        await assertRevert(validators.vote(group, NULL_ADDRESS, NULL_ADDRESS))
      })
    })

    describe('when the account has no weight', () => {
      beforeEach(async () => {
        await mockBondedDeposits.setWeight(voter, NULL_ADDRESS)
      })

      it('should revert', async () => {
        await assertRevert(validators.vote(group, NULL_ADDRESS, NULL_ADDRESS))
      })
    })
    describe('when the account has an outstanding vote', () => {
      beforeEach(async () => {
        await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
      })

      it('should revert', async () => {
        await assertRevert(validators.vote(group, NULL_ADDRESS, NULL_ADDRESS))
      })
    })
  })

  describe('#revokeVote', () => {
    const weight = 5
    const voter = accounts[0]
    const validator = accounts[1]
    const group = accounts[2]
    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group, [validator])
      await mockBondedDeposits.setWeight(voter, weight)
      await validators.vote(group, NULL_ADDRESS, NULL_ADDRESS)
    })

    it("should clear the voter's vote", async () => {
      await validators.revokeVote(NULL_ADDRESS, NULL_ADDRESS)
      assert.isFalse(await validators.isVoting(voter))
      assert.equal(await validators.voters(voter), NULL_ADDRESS)
    })

    it("should decrement the validator group's vote total", async () => {
      await validators.revokeVote(NULL_ADDRESS, NULL_ADDRESS)
      const [groups, votes] = await validators.getValidatorGroupVotes()
      assert.deepEqual(groups, [])
      assert.deepEqual(votes, [])
    })

    it('should emit the ValidatorGroupVoteRevoked event', async () => {
      const resp = await validators.revokeVote(NULL_ADDRESS, NULL_ADDRESS)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ValidatorGroupVoteRevoked',
        args: {
          account: voter,
          group,
          weight: new BigNumber(weight),
        },
      })
    })

    describe('when the group had not received other votes', () => {
      it('should remove the group from the list of electable groups with votes', async () => {
        await validators.revokeVote(NULL_ADDRESS, NULL_ADDRESS)
        const [groups] = await validators.getValidatorGroupVotes()
        assert.deepEqual(groups, [])
      })
    })

    describe('when the account does not have an outstanding vote', () => {
      beforeEach(async () => {
        await validators.revokeVote(NULL_ADDRESS, NULL_ADDRESS)
      })

      it('should revert', async () => {
        await assertRevert(validators.revokeVote(NULL_ADDRESS, NULL_ADDRESS))
      })
    })
  })

  describe('#getValidators', () => {
    const group1 = accounts[0]
    const group2 = accounts[1]
    const group3 = accounts[2]
    const validator1 = accounts[3]
    const validator2 = accounts[4]
    const validator3 = accounts[5]
    const validator4 = accounts[6]
    const validator5 = accounts[7]
    const validator6 = accounts[8]
    const validator7 = accounts[9]

    // If voterN votes for groupN:
    //   group1 gets 20 votes per member
    //   group2 gets 25 votes per member
    //   group3 gets 30 votes per member
    // The ordering of the returned validators should be from group with most votes to group,
    // with fewest votes, and within each group, members are elected from first to last.
    const voter1 = { address: accounts[0], weight: 80 }
    const voter2 = { address: accounts[1], weight: 50 }
    const voter3 = { address: accounts[2], weight: 30 }
    const assertAddressesEqual = (actual: string[], expected: string[]) => {
      assert.deepEqual(actual.map((x) => x.toLowerCase()), expected.map((x) => x.toLowerCase()))
    }

    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group1, [
        validator1,
        validator2,
        validator3,
        validator4,
      ])
      await registerValidatorGroupWithMembers(group2, [validator5, validator6])
      await registerValidatorGroupWithMembers(group3, [validator7])

      for (const voter of [voter1, voter2, voter3]) {
        await mockBondedDeposits.setWeight(voter.address, voter.weight)
      }
    })

    describe('when a single group has >= minElectableValidators as members and received votes', () => {
      beforeEach(async () => {
        await validators.vote(group1, NULL_ADDRESS, NULL_ADDRESS, { from: voter1.address })
      })

      it("should return that group's member list", async () => {
        assertAddressesEqual(await validators.getValidators(), [
          validator1,
          validator2,
          validator3,
          validator4,
        ])
      })
    })

    describe("when > maxElectableValidators members's groups receive votes", () => {
      beforeEach(async () => {
        await validators.vote(group1, NULL_ADDRESS, NULL_ADDRESS, { from: voter1.address })
        await validators.vote(group2, NULL_ADDRESS, group1, { from: voter2.address })
        await validators.vote(group3, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should return maxElectableValidators elected validators', async () => {
        assertAddressesEqual(await validators.getValidators(), [
          validator1,
          validator2,
          validator3,
          validator5,
          validator6,
          validator7,
        ])
      })
    })

    describe('when a group receives enough votes for > n seats but only has n members', () => {
      beforeEach(async () => {
        await mockBondedDeposits.setWeight(voter3.address, 1000)
        await validators.vote(group3, NULL_ADDRESS, NULL_ADDRESS, { from: voter3.address })
        await validators.vote(group1, NULL_ADDRESS, group3, { from: voter1.address })
        await validators.vote(group2, NULL_ADDRESS, group1, { from: voter2.address })
      })

      it('should elect only n members from that group', async () => {
        assertAddressesEqual(await validators.getValidators(), [
          validator7,
          validator1,
          validator2,
          validator3,
          validator5,
          validator6,
        ])
      })
    })

    describe('when an account has delegated validating to another address', () => {
      const validatingDelegate = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
      beforeEach(async () => {
        await mockBondedDeposits.delegateValidating(validator3, validatingDelegate)
        await validators.vote(group1, NULL_ADDRESS, NULL_ADDRESS, { from: voter1.address })
        await validators.vote(group2, NULL_ADDRESS, group1, { from: voter2.address })
        await validators.vote(group3, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should return the validating delegate in place of the account', async () => {
        assertAddressesEqual(await validators.getValidators(), [
          validator1,
          validator2,
          validatingDelegate,
          validator5,
          validator6,
          validator7,
        ])
      })
    })

    describe('when there are not enough electable validators', () => {
      beforeEach(async () => {
        await validators.vote(group2, NULL_ADDRESS, NULL_ADDRESS, { from: voter2.address })
        await validators.vote(group3, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should revert', async () => {
        await assertRevert(validators.getValidators())
      })
    })
  })
})
