import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockElectionContract,
  MockElectionInstance,
  RegistryContract,
  RegistryInstance,
  ValidatorsContract,
  ValidatorsInstance,
} from 'types'
import { toFixed } from '@celo/utils/lib/fixidity'

const Validators: ValidatorsContract = artifacts.require('Validators')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Validators.numberFormat = 'BigNumber'

const parseValidatorParams = (validatorParams: any) => {
  return {
    name: validatorParams[0],
    url: validatorParams[1],
    publicKeysData: validatorParams[2],
    affiliation: validatorParams[3],
  }
}

const parseValidatorGroupParams = (groupParams: any) => {
  return {
    name: groupParams[0],
    url: groupParams[1],
    members: groupParams[2],
  }
}

const HOUR = 60 * 60
const DAY = 24 * HOUR
const MAX_UINT256 = new BigNumber(2).pow(256).minus(1)

contract('Validators', (accounts: string[]) => {
  let validators: ValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let mockElection: MockElectionInstance
  // A random 64 byte hex string.
  const publicKey =
    'ea0733ad275e2b9e05541341a97ee82678c58932464fad26164657a111a7e37a9fa0300266fb90e2135a1f1512350cb4e985488a88809b14e3cbe415e76e82b2'
  const blsPublicKey =
    '4d23d8cd06f30b1fa7cf368e2f5399ab04bb6846c682f493a98a607d3dfb7e53a712bb79b475c57b0ac2785460f91301'
  const blsPoP =
    '9d3e1d8f49f6b0d8e9a03d80ca07b1d24cf1cc0557bdcc04f5e17a46e35d02d0d411d956dbd5d2d2464eebd7b74ae30005d223780d785d2abc5644fac7ac29fb0e302bdc80c81a5d45018b68b1045068a4b3a4861c93037685fd0d252d740501'

  const publicKeysData = '0x' + publicKey + blsPublicKey + blsPoP

  const nonOwner = accounts[1]
  const registrationRequirements = { group: new BigNumber(1000), validator: new BigNumber(100) }
  const deregistrationLockups = {
    group: new BigNumber(100 * DAY),
    validator: new BigNumber(60 * DAY),
  }
  const maxGroupSize = 5
  const name = 'test-name'
  const url = 'test-url'
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
      registrationRequirements.group,
      registrationRequirements.validator,
      deregistrationLockups.group,
      deregistrationLockups.validator,
      maxGroupSize
    )
  })

  const registerValidator = async (validator: string) => {
    await mockLockedGold.setAccountTotalLockedGold(validator, registrationRequirements.validator)
    await validators.registerValidator(
      name,
      url,
      // @ts-ignore bytes type
      publicKeysData,
      { from: validator }
    )
  }

  const registerValidatorGroup = async (group: string) => {
    await mockLockedGold.setAccountTotalLockedGold(group, registrationRequirements.group)
    await validators.registerValidatorGroup(name, url, commission, { from: group })
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

    it('should have set the registration requirements', async () => {
      const [group, validator] = await validators.getRegistrationRequirements()
      assertEqualBN(group, registrationRequirements.group)
      assertEqualBN(validator, registrationRequirements.validator)
    })

    it('should have set the deregistration lockups', async () => {
      const [group, validator] = await validators.getDeregistrationLockups()
      assertEqualBN(group, deregistrationLockups.group)
      assertEqualBN(validator, deregistrationLockups.validator)
    })

    it('should have set the max group size', async () => {
      const actualMaxGroupSize = await validators.getMaxGroupSize()
      assertEqualBN(actualMaxGroupSize, maxGroupSize)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        validators.initialize(
          registry.address,
          registrationRequirements.group,
          registrationRequirements.validator,
          deregistrationLockups.group,
          deregistrationLockups.validator,
          maxGroupSize
        )
      )
    })
  })

  describe('#setRegistrationRequirements()', () => {
    describe('when the requirements are different', () => {
      const newRequirements = {
        group: registrationRequirements.group.plus(1),
        validator: registrationRequirements.validator.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setRegistrationRequirements(
            newRequirements.group,
            newRequirements.validator
          )
        })

        it('should set the group and validator requirements', async () => {
          const [group, validator] = await validators.getRegistrationRequirements()
          assertEqualBN(group, newRequirements.group)
          assertEqualBN(validator, newRequirements.validator)
        })

        it('should emit the RegistrationRequirementsSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'RegistrationRequirementsSet',
            args: {
              group: new BigNumber(newRequirements.group),
              validator: new BigNumber(newRequirements.validator),
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertRevert(
              validators.setRegistrationRequirements(
                newRequirements.group,
                newRequirements.validator,
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
            validators.setRegistrationRequirements(
              registrationRequirements.group,
              registrationRequirements.validator
            )
          )
        })
      })
    })
  })

  describe('#setDeregistrationLockups()', () => {
    describe('when the requirements are different', () => {
      const newLockups = {
        group: deregistrationLockups.group.plus(1),
        validator: deregistrationLockups.validator.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setDeregistrationLockups(newLockups.group, newLockups.validator)
        })

        it('should set the group and validator requirements', async () => {
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

      describe('when the requirements are the same', () => {
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

  describe('#setMaxGroupSize()', () => {
    describe('when the size is different', () => {
      describe('when called by the owner', () => {
        let resp: any
        const newSize = maxGroupSize + 1

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
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          validator,
          registrationRequirements.validator
        )
        resp = await validators.registerValidator(
          name,
          url,
          // @ts-ignore bytes type
          publicKeysData
        )
      })

      it('should mark the account as a validator', async () => {
        assert.isTrue(await validators.isValidator(validator))
      })

      it('should add the account to the list of validators', async () => {
        assert.deepEqual(await validators.getRegisteredValidators(), [validator])
      })

      it('should set the validator name, url, and public key', async () => {
        const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
        assert.equal(parsedValidator.name, name)
        assert.equal(parsedValidator.url, url)
        assert.equal(parsedValidator.publicKeysData, publicKeysData)
      })

      it('should set account balance requirements on locked gold', async () => {
        const [value, timestamp] = await mockLockedGold.getAccountMustMaintain(validator)
        assertEqualBN(value, registrationRequirements.validator)
        assertEqualBN(timestamp, MAX_UINT256)
      })

      it('should emit the ValidatorRegistered event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorRegistered',
          args: {
            validator,
            name,
            url,
            publicKeysData,
          },
        })
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          validator,
          registrationRequirements.validator
        )
        await validators.registerValidator(
          name,
          url,
          // @ts-ignore bytes type
          publicKeysData
        )
        assert.deepEqual(await validators.getRegisteredValidators(), [validator])
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(validator, registrationRequirements.group)
        await validators.registerValidatorGroup(name, url, commission)
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            name,
            url,
            // @ts-ignore bytes type
            publicKeysData
          )
        )
      })
    })

    describe('when the account does not meet the registration requirements', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          validator,
          registrationRequirements.validator.minus(1)
        )
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidator(
            name,
            url,
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

      it('should set account balance requirements on locked gold', async () => {
        const latestTimestamp = (await web3.eth.getBlock('latest')).timestamp
        const [value, timestamp] = await mockLockedGold.getAccountMustMaintain(validator)
        assertEqualBN(value, registrationRequirements.validator)
        assertEqualBN(
          timestamp,
          new BigNumber(latestTimestamp).plus(deregistrationLockups.validator)
        )
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
          await validators.addMember(validator, { from: group })
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
          await validators.addMember(validator, { from: group })
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
        await validators.addMember(validator, { from: group })
      })

      it('should remove the validator from the group membership list', async () => {
        await validators.deaffiliate()
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert.deepEqual(parsedGroup.members, [])
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
        await mockLockedGold.setAccountTotalLockedGold(group, registrationRequirements.group)
        resp = await validators.registerValidatorGroup(name, url, commission)
      })

      it('should mark the account as a validator group', async () => {
        assert.isTrue(await validators.isValidatorGroup(group))
      })

      it('should add the account to the list of validator groups', async () => {
        assert.deepEqual(await validators.getRegisteredValidatorGroups(), [group])
      })

      it('should set the validator group name and url', async () => {
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert.equal(parsedGroup.name, name)
        assert.equal(parsedGroup.url, url)
      })

      it('should emit the ValidatorGroupRegistered event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorGroupRegistered',
          args: {
            group,
            name,
            url,
          },
        })
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await registerValidator(group)
      })

      it('should revert', async () => {
        await assertRevert(
          validators.registerValidatorGroup(name, url, registrationRequirements.group)
        )
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(group, registrationRequirements.group)
        await validators.registerValidatorGroup(name, url, commission)
      })

      it('should revert', async () => {
        await assertRevert(validators.registerValidatorGroup(name, url, commission))
      })
    })

    describe('when the account does not meet the registration requirements', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          group,
          registrationRequirements.group.minus(1)
        )
      })

      it('should revert', async () => {
        await assertRevert(validators.registerValidatorGroup(name, url, commission))
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

    it('should set account balance requirements on locked gold', async () => {
      const latestTimestamp = (await web3.eth.getBlock('latest')).timestamp
      const [value, timestamp] = await mockLockedGold.getAccountMustMaintain(group)
      assertEqualBN(value, registrationRequirements.group)
      assertEqualBN(timestamp, new BigNumber(latestTimestamp).plus(deregistrationLockups.group))
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
    let resp: any
    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
      await validators.affiliate(group, { from: validator })
      resp = await validators.addMember(validator)
    })

    it('should add the member to the list of members', async () => {
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.deepEqual(parsedGroup.members, [validator])
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
      await assertRevert(validators.addMember(validator, { from: accounts[2] }))
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertRevert(validators.addMember(accounts[2]))
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
        await assertRevert(validators.addMember(validator))
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
})
