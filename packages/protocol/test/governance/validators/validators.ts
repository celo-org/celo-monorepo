import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertEqualBNArray,
  assertEqualDpBN,
  assertRevert,
  assertSameAddress,
  assertTransactionRevertWithReason,
  currentEpochNumber,
  mineBlocks,
  mineToNextEpoch,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { fixed1, fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  MockElectionContract,
  MockElectionInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryContract,
  RegistryInstance,
  ValidatorsMockContract,
  ValidatorsMockInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const Validators: ValidatorsMockContract = artifacts.require('ValidatorsTest')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Validators.numberFormat = 'BigNumber'

const parseValidatorParams = (validatorParams: any) => {
  return {
    ecdsaPublicKey: validatorParams[0],
    blsPublicKey: validatorParams[1],
    affiliation: validatorParams[2],
    score: validatorParams[3],
    signer: validatorParams[4],
  }
}

const parseValidatorGroupParams = (groupParams: any) => {
  return {
    members: groupParams[0],
    commission: groupParams[1],
    nextCommission: groupParams[2],
    nextCommissionBlock: groupParams[3],
    sizeHistory: groupParams[4],
    slashingMultiplier: groupParams[5],
    lastSlashed: groupParams[6],
  }
}

const parseMembershipHistory = (membershipHistory: any) => {
  return {
    epochs: membershipHistory[0],
    groups: membershipHistory[1],
    lastRemovedFromGroupTimestamp: membershipHistory[2],
    tail: membershipHistory[3],
  }
}

const HOUR = 60 * 60
const DAY = 24 * HOUR

contract('Validators', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: ValidatorsMockInstance
  let registry: RegistryInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  const nonOwner = accounts[1]

  const validatorLockedGoldRequirements = {
    value: new BigNumber(1000),
    duration: new BigNumber(60 * DAY),
  }
  const groupLockedGoldRequirements = {
    value: new BigNumber(1000),
    duration: new BigNumber(100 * DAY),
  }
  const validatorScoreParameters = {
    exponent: new BigNumber(5),
    adjustmentSpeed: toFixed(0.25),
  }

  const one = new BigNumber(1)
  const max1 = (num: BigNumber) => (num.gt(one) ? one : num)
  const calculateScore = (uptime: BigNumber, gracePeriod: BigNumber) =>
    max1(uptime.plus(gracePeriod)).pow(validatorScoreParameters.exponent)

  const slashingMultiplierResetPeriod = 30 * DAY
  const membershipHistoryLength = new BigNumber(5)
  const maxGroupSize = new BigNumber(5)
  const commissionUpdateDelay = new BigNumber(3)
  const downtimeGracePeriod = new BigNumber(0)

  // A random 64 byte hex string.
  const blsPublicKey =
    '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00'
  const blsPoP =
    '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900'
  const commission = toFixed(1 / 100)
  beforeEach(async () => {
    accountsInstance = await Accounts.new(true)
    // Do not register an account for the last address so it can be used as an authorized validator signer.
    await Promise.all(
      accounts.slice(0, -1).map((account) => accountsInstance.createAccount({ from: account }))
    )
    mockElection = await MockElection.new()
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new(true)
    validators = await Validators.new()
    await accountsInstance.initialize(registry.address)

    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)

    await validators.initialize(
      registry.address,
      groupLockedGoldRequirements.value,
      groupLockedGoldRequirements.duration,
      validatorLockedGoldRequirements.value,
      validatorLockedGoldRequirements.duration,
      validatorScoreParameters.exponent,
      validatorScoreParameters.adjustmentSpeed,
      membershipHistoryLength,
      slashingMultiplierResetPeriod,
      maxGroupSize,
      commissionUpdateDelay,
      downtimeGracePeriod
    )
    console.log('### adj speed:', validatorScoreParameters.adjustmentSpeed)
  })

  const registerValidator = async (validator: string) => {
    await mockLockedGold.setAccountTotalLockedGold(validator, validatorLockedGoldRequirements.value)
    const publicKey = await addressToPublicKey(validator, web3.eth.sign)
    await validators.registerValidator(publicKey, blsPublicKey, blsPoP, { from: validator })
  }

  const registerValidatorGroup = async (group: string, numMembers: number = 1) => {
    await mockLockedGold.setAccountTotalLockedGold(
      group,
      groupLockedGoldRequirements.value.times(numMembers)
    )
    await validators.registerValidatorGroup(commission, { from: group })
  }

  const registerValidatorGroupWithMembers = async (group: string, members: string[]) => {
    await registerValidatorGroup(group, members.length)
    for (const validator of members) {
      await registerValidator(validator)
      await validators.affiliate(group, { from: validator })
      if (validator === members[0]) {
        await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
      } else {
        await validators.addMember(validator, { from: group })
      }
    }
  }

  describe('#initialize()', () => {
    // it('should have set the owner', async () => {
    //   const owner: string = await validators.owner()
    //   assert.equal(owner, accounts[0])
    // })
    // it('should have set the group locked gold requirements', async () => {
    //   const [value, duration] = await validators.getGroupLockedGoldRequirements()
    //   assertEqualBN(value, groupLockedGoldRequirements.value)
    //   assertEqualBN(duration, groupLockedGoldRequirements.duration)
    // })
    // it('should have set the validator locked gold requirements', async () => {
    //   const [value, duration] = await validators.getValidatorLockedGoldRequirements()
    //   assertEqualBN(value, validatorLockedGoldRequirements.value)
    //   assertEqualBN(duration, validatorLockedGoldRequirements.duration)
    // })
    // it('should have set the validator score parameters', async () => {
    //   const [exponent, adjustmentSpeed] = await validators.getValidatorScoreParameters()
    //   assertEqualBN(exponent, validatorScoreParameters.exponent)
    //   assertEqualBN(adjustmentSpeed, validatorScoreParameters.adjustmentSpeed)
    // })
    // it('should have set the membership history length', async () => {
    //   const actual = await validators.membershipHistoryLength()
    //   assertEqualBN(actual, membershipHistoryLength)
    // })
    // it('should have set the max group size', async () => {
    //   const actualMaxGroupSize = await validators.getMaxGroupSize()
    //   assertEqualBN(actualMaxGroupSize, maxGroupSize)
    // })
    // it('should have set the commision update delay', async () => {
    //   const actualCommissionUpdateDelay = await validators.getCommissionUpdateDelay()
    //   assertEqualBN(actualCommissionUpdateDelay, commissionUpdateDelay)
    // })
    // it('should have set the downtime grace period', async () => {
    //   const actualDowntimeGracePeriod = await validators.downtimeGracePeriod()
    //   assertEqualBN(actualDowntimeGracePeriod, downtimeGracePeriod)
    // })
    // it('should not be callable again', async () => {
    //   await assertTransactionRevertWithReason(
    //     validators.initialize(
    //       registry.address,
    //       groupLockedGoldRequirements.value,
    //       groupLockedGoldRequirements.duration,
    //       validatorLockedGoldRequirements.value,
    //       validatorLockedGoldRequirements.duration,
    //       validatorScoreParameters.exponent,
    //       validatorScoreParameters.adjustmentSpeed,
    //       membershipHistoryLength,
    //       slashingMultiplierResetPeriod,
    //       maxGroupSize,
    //       commissionUpdateDelay,
    //       downtimeGracePeriod
    //     ),
    //     'contract already initialized'
    //   )
    // })
  })

  describe('#setMembershipHistoryLength()', () => {
    // describe('when the length is different', () => {
    //   const newLength = membershipHistoryLength.plus(1)
    //   describe('when called by the owner', () => {
    //     let resp: any
    //     beforeEach(async () => {
    //       resp = await validators.setMembershipHistoryLength(newLength)
    //     })
    //     // it('should set the membership history length', async () => {
    //     //   assertEqualBN(await validators.membershipHistoryLength(), newLength)
    //     // })
    //     // it('should emit the MembershipHistoryLengthSet event', async () => {
    //     //   assert.equal(resp.logs.length, 1)
    //     //   const log = resp.logs[0]
    //     //   assertContainSubset(log, {
    //     //     event: 'MembershipHistoryLengthSet',
    //     //     args: {
    //     //       length: new BigNumber(newLength),
    //     //     },
    //     //   })
    //     // })
    //     describe('when called by a non-owner', () => {
    //       // it('should revert', async () => {
    //       //   await assertTransactionRevertWithReason(
    //       //     validators.setMembershipHistoryLength(newLength, {
    //       //       from: nonOwner,
    //       //     }),
    //       //     'Ownable: caller is not the owner'
    //       //   )
    //       // })
    //     })
    //   })
    //   // describe('when the length is the same', () => {
    //   //   it('should revert', async () => {
    //   //     await assertTransactionRevertWithReason(
    //   //       validators.setMembershipHistoryLength(membershipHistoryLength),
    //   //       'Membership history length not changed'
    //   //     )
    //   //   })
    //   // })
    // })
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
            await assertTransactionRevertWithReason(
              validators.setMaxGroupSize(newSize, {
                from: nonOwner,
              }),
              'Ownable: caller is not the owner'
            )
          })
        })
      })

      describe('when the size is the same', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.setMaxGroupSize(maxGroupSize),
            'Max group size not changed'
          )
        })
      })
    })
  })

  describe('#setGroupLockedGoldRequirements()', () => {
    describe('when the requirements are different', () => {
      const newRequirements = {
        value: groupLockedGoldRequirements.value.plus(1),
        duration: groupLockedGoldRequirements.duration.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setGroupLockedGoldRequirements(
            newRequirements.value,
            newRequirements.duration
          )
        })

        it('should have set the group locked gold requirements', async () => {
          const [value, duration] = await validators.getGroupLockedGoldRequirements()
          assertEqualBN(value, newRequirements.value)
          assertEqualBN(duration, newRequirements.duration)
        })

        it('should emit the GroupLockedGoldRequirementsSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'GroupLockedGoldRequirementsSet',
            args: {
              value: newRequirements.value,
              duration: newRequirements.duration,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              validators.setGroupLockedGoldRequirements(
                newRequirements.value,
                newRequirements.duration,
                { from: nonOwner }
              ),
              'Ownable: caller is not the owner'
            )
          })
        })
      })

      describe('when the requirements are the same', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.setGroupLockedGoldRequirements(
              groupLockedGoldRequirements.value,
              groupLockedGoldRequirements.duration
            ),
            'Group requirements not changed'
          )
        })
      })
    })
  })

  describe('#setValidatorLockedGoldRequirements()', () => {
    describe('when the requirements are different', () => {
      const newRequirements = {
        value: validatorLockedGoldRequirements.value.plus(1),
        duration: validatorLockedGoldRequirements.duration.plus(1),
      }

      describe('when called by the owner', () => {
        let resp: any

        beforeEach(async () => {
          resp = await validators.setValidatorLockedGoldRequirements(
            newRequirements.value,
            newRequirements.duration
          )
        })

        it('should have set the validator locked gold requirements', async () => {
          const [value, duration] = await validators.getValidatorLockedGoldRequirements()
          assertEqualBN(value, newRequirements.value)
          assertEqualBN(duration, newRequirements.duration)
        })

        it('should emit the ValidatorLockedGoldRequirementsSet event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorLockedGoldRequirementsSet',
            args: {
              value: newRequirements.value,
              duration: newRequirements.duration,
            },
          })
        })

        describe('when called by a non-owner', () => {
          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              validators.setValidatorLockedGoldRequirements(
                newRequirements.value,
                newRequirements.duration,
                { from: nonOwner }
              ),
              'Ownable: caller is not the owner'
            )
          })
        })
      })

      describe('when the requirements are the same', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.setValidatorLockedGoldRequirements(
              validatorLockedGoldRequirements.value,
              validatorLockedGoldRequirements.duration
            ),
            'Validator requirements not changed'
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
            await assertTransactionRevertWithReason(
              validators.setValidatorScoreParameters(
                newParameters.exponent,
                newParameters.adjustmentSpeed,
                {
                  from: nonOwner,
                }
              ),
              'Ownable: caller is not the owner'
            )
          })
        })
      })

      describe('when the lockups are the same', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.setValidatorScoreParameters(
              validatorScoreParameters.exponent,
              validatorScoreParameters.adjustmentSpeed
            ),
            'Adjustment speed and exponent not changed'
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
          await assertTransactionRevertWithReason(
            validators.setMaxGroupSize(maxGroupSize),
            'Max group size not changed'
          )
        })
      })
    })

    describe('when called by a non-owner', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.setMaxGroupSize(maxGroupSize, { from: nonOwner }),
          'Ownable: caller is not the owner'
        )
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
          validatorLockedGoldRequirements.value
        )
      })

      it('should revert when vote over max number of groups set to true', async () => {
        await mockElection.setAllowedToVoteOverMaxNumberOfGroups(validator, true)
        const signer = accounts[9]
        const sig = await getParsedSignatureOfAddress(web3, validator, signer)
        await accountsInstance.authorizeValidatorSigner(signer, sig.v, sig.r, sig.s)
        const publicKey = await addressToPublicKey(signer, web3.eth.sign)
        await assertTransactionRevertWithReason(
          validators.registerValidator(publicKey, blsPublicKey, blsPoP),
          'Cannot vote for more than max number of groups'
        )
      })

      it('should revert when delegating Celo', async () => {
        await mockLockedGold.setAccountTotalDelegatedAmountInPercents(validator, 10)
        const signer = accounts[9]
        const sig = await getParsedSignatureOfAddress(web3, validator, signer)
        await accountsInstance.authorizeValidatorSigner(signer, sig.v, sig.r, sig.s)
        const publicKey = await addressToPublicKey(signer, web3.eth.sign)
        await assertTransactionRevertWithReason(
          validators.registerValidator(publicKey, blsPublicKey, blsPoP),
          'Cannot delegate governance power'
        )
      })

      describe('when the account has authorized a validator signer', () => {
        let validatorRegistrationEpochNumber: number
        let publicKey: string
        let signer: string
        beforeEach(async () => {
          signer = accounts[9]
          const sig = await getParsedSignatureOfAddress(web3, validator, signer)
          await accountsInstance.authorizeValidatorSigner(signer, sig.v, sig.r, sig.s)
          publicKey = await addressToPublicKey(signer, web3.eth.sign)
          resp = await validators.registerValidator(publicKey, blsPublicKey, blsPoP)
          validatorRegistrationEpochNumber = await currentEpochNumber(web3)
        })

        it('should mark the account as a validator', async () => {
          assert.isTrue(await validators.isValidator(validator))
        })

        it('should add the account to the list of validators', async () => {
          assert.deepEqual(await validators.getRegisteredValidators(), [validator])
        })

        it('should set the validator ecdsa public key', async () => {
          const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
          assert.equal(parsedValidator.ecdsaPublicKey, publicKey)
        })

        it('should set the validator bls public key', async () => {
          const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
          assert.equal(parsedValidator.blsPublicKey, blsPublicKey)
        })

        it('should set the validator signer', async () => {
          const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
          assert.equal(parsedValidator.signer, signer)
        })

        it('should set account locked gold requirements', async () => {
          const requirement = await validators.getAccountLockedGoldRequirement(validator)
          assertEqualBN(requirement, validatorLockedGoldRequirements.value)
        })

        it('should set the validator membership history', async () => {
          const membershipHistory = await validators.getMembershipHistory(validator)
          assertEqualBNArray(membershipHistory[0], [validatorRegistrationEpochNumber])
          assert.deepEqual(membershipHistory[1], [NULL_ADDRESS])
        })

        it('should set the validator membership history', async () => {
          const membershipHistory = await validators.getMembershipHistory(validator)
          assertEqualBNArray(membershipHistory[0], [validatorRegistrationEpochNumber])
          assert.deepEqual(membershipHistory[1], [NULL_ADDRESS])
        })

        it('should emit the ValidatorEcdsaPublicKeyUpdated, ValidatorBlsPublicKeyUpdated, and ValidatorRegistered events', async () => {
          assert.equal(resp.logs.length, 3)
          assertContainSubset(resp.logs[0], {
            event: 'ValidatorEcdsaPublicKeyUpdated',
            args: {
              validator,
              ecdsaPublicKey: publicKey,
            },
          })
          assertContainSubset(resp.logs[1], {
            event: 'ValidatorBlsPublicKeyUpdated',
            args: {
              validator,
              blsPublicKey,
            },
          })
          assertContainSubset(resp.logs[2], {
            event: 'ValidatorRegistered',
            args: {
              validator,
            },
          })
        })
      })
    })

    describe('when the account is already a registered validator ', () => {
      let publicKey: string
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          validator,
          validatorLockedGoldRequirements.value
        )
      })

      it('should revert', async () => {
        publicKey = await addressToPublicKey(validator, web3.eth.sign)
        await validators.registerValidator(publicKey, blsPublicKey, blsPoP)
        await assertTransactionRevertWithReason(
          validators.registerValidator(publicKey, blsPublicKey, blsPoP),
          'Already registered'
        )
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(validator, groupLockedGoldRequirements.value)
        await validators.registerValidatorGroup(commission)
      })

      it('should revert', async () => {
        const publicKey = await addressToPublicKey(validator, web3.eth.sign)
        await assertTransactionRevertWithReason(
          validators.registerValidator(publicKey, blsPublicKey, blsPoP),
          'Already registered'
        )
      })
    })

    describe('when the account does not meet the locked gold requirements', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(
          validator,
          validatorLockedGoldRequirements.value.minus(11)
        )
      })

      it('should revert', async () => {
        const publicKey = await addressToPublicKey(validator, web3.eth.sign)
        await assertTransactionRevertWithReason(
          validators.registerValidator(publicKey, blsPublicKey, blsPoP),
          'Deposit too small'
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
      })

      describe('when the validator has never been a member of a validator group', () => {
        beforeEach(async () => {
          resp = await validators.deregisterValidator(index)
        })

        it('should mark the account as not a validator', async () => {
          assert.isFalse(await validators.isValidator(validator))
        })

        it('should remove the account from the list of validators', async () => {
          assert.deepEqual(await validators.getRegisteredValidators(), [])
        })

        it('should reset account balance requirements', async () => {
          const requirement = await validators.getAccountLockedGoldRequirement(validator)
          assertEqualBN(requirement, 0)
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

      describe('when the validator has been a member of a validator group', () => {
        const group = accounts[1]
        beforeEach(async () => {
          await registerValidatorGroup(group)
          await validators.affiliate(group)
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
        })

        describe('when the validator is no longer a member of a validator group', () => {
          beforeEach(async () => {
            await validators.removeMember(validator, { from: group })
          })

          describe('when it has been more than `validatorLockedGoldRequirements.duration` since the validator was removed from the group', () => {
            beforeEach(async () => {
              await timeTravel(validatorLockedGoldRequirements.duration.plus(1).toNumber(), web3)
              resp = await validators.deregisterValidator(index)
            })

            it('should mark the account as not a validator', async () => {
              assert.isFalse(await validators.isValidator(validator))
            })

            it('should remove the account from the list of validators', async () => {
              assert.deepEqual(await validators.getRegisteredValidators(), [])
            })

            it('should reset account balance requirements', async () => {
              const requirement = await validators.getAccountLockedGoldRequirement(validator)
              assertEqualBN(requirement, 0)
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

          describe('when it has been less than `validatorLockedGoldRequirements.duration` since the validator was removed from the group', () => {
            beforeEach(async () => {
              await timeTravel(validatorLockedGoldRequirements.duration.minus(1).toNumber(), web3)
            })

            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                validators.deregisterValidator(index),
                'Not yet requirement end time'
              )
            })
          })
        })

        describe('when the validator is still a member of a validator group', () => {
          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              validators.deregisterValidator(index),
              'Has been group member recently'
            )
          })
        })
      })
    })

    it('should revert when the account is not a registered validator', async () => {
      await assertTransactionRevertWithReason(
        validators.deregisterValidator(index, { from: accounts[2] }),
        'Not a validator'
      )
    })

    it('should revert when the wrong index is provided', async () => {
      await assertTransactionRevertWithReason(
        validators.deregisterValidator(index + 1),
        'Not a validator'
      )
    })
  })

  describe('#affiliate', () => {
    const validator = accounts[0]
    const group = accounts[1]
    let registrationEpoch: number
    let resp: any
    describe('when the account has a registered validator', () => {
      beforeEach(async () => {
        await registerValidator(validator)
        registrationEpoch = await currentEpochNumber(web3)
      })
      describe('when affiliating with a registered validator group', () => {
        beforeEach(async () => {
          await registerValidatorGroup(group)
        })

        describe('when the validator meets the locked gold requirements', () => {
          describe('when the group meets the locked gold requirements', () => {
            beforeEach(async () => {
              resp = await validators.affiliate(group)
            })

            it('should set the affiliate', async () => {
              await validators.affiliate(group)
              const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
              assert.equal(parsedValidator.affiliation, group)
            })

            it('should emit the ValidatorAffiliated event', async () => {
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
                await registerValidatorGroup(otherGroup)
              })

              describe('when the validator is not a member of that validator group', () => {
                beforeEach(async () => {
                  resp = await validators.affiliate(otherGroup)
                })

                it('should set the affiliate', async () => {
                  const parsedValidator = parseValidatorParams(
                    await validators.getValidator(validator)
                  )
                  assert.equal(parsedValidator.affiliation, otherGroup)
                })

                it('should emit the ValidatorDeaffilliated event', async () => {
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
              })

              describe('when the validator is a member of that group', () => {
                let additionEpoch: number
                let affiliationEpoch: number
                beforeEach(async () => {
                  await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
                    from: group,
                  })
                  additionEpoch = await currentEpochNumber(web3)
                  resp = await validators.affiliate(otherGroup)
                  affiliationEpoch = await currentEpochNumber(web3)
                })

                it('should remove the validator from the group membership list', async () => {
                  const parsedGroup = parseValidatorGroupParams(
                    await validators.getValidatorGroup(group)
                  )
                  assert.deepEqual(parsedGroup.members, [])
                })

                it("should update the validator's membership history", async () => {
                  const membershipHistory = parseMembershipHistory(
                    await validators.getMembershipHistory(validator)
                  )
                  let expectedEntries = 1
                  if (registrationEpoch !== additionEpoch || additionEpoch !== affiliationEpoch) {
                    expectedEntries = 2
                  }
                  assert.equal(membershipHistory.epochs.length, expectedEntries)
                  assertEqualBN(membershipHistory.epochs[expectedEntries - 1], affiliationEpoch)
                  assert.equal(membershipHistory.groups.length, expectedEntries)
                  assertSameAddress(membershipHistory.groups[expectedEntries - 1], NULL_ADDRESS)
                  const latestBlock = await web3.eth.getBlock('latest')
                  assert.equal(
                    membershipHistory.lastRemovedFromGroupTimestamp,
                    latestBlock.timestamp
                  )
                })

                it('should emit the ValidatorGroupMemberRemoved event', async () => {
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
                    assert.isTrue(await mockElection.isIneligible(group))
                  })
                })
              })
            })
          })

          describe('when the group does not meet the locked gold requirements', () => {
            beforeEach(async () => {
              await mockLockedGold.setAccountTotalLockedGold(
                group,
                groupLockedGoldRequirements.value.minus(11)
              )
            })

            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                validators.affiliate(group),
                "Group doesn't meet requirements"
              )
            })
          })
        })

        describe('when the validator does not meet the locked gold requirements', () => {
          beforeEach(async () => {
            await mockLockedGold.setAccountTotalLockedGold(
              validator,
              validatorLockedGoldRequirements.value.minus(11)
            )
          })

          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              validators.affiliate(group),
              "Validator doesn't meet requirements"
            )
          })
        })
      })

      describe('when affiliating with a non-registered validator group', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.affiliate(group),
            'Not a validator group'
          )
        })
      })
    })

    describe('when the account does not have a registered validator', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(validators.affiliate(group), 'Not a validator')
      })
    })
  })

  describe('#deaffiliate', () => {
    const validator = accounts[0]
    const group = accounts[1]
    let registrationEpoch: number
    beforeEach(async () => {
      await registerValidator(validator)
      registrationEpoch = await currentEpochNumber(web3)
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
      let additionEpoch: number
      let deaffiliationEpoch: number
      let resp: any
      beforeEach(async () => {
        await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, { from: group })
        additionEpoch = await currentEpochNumber(web3)
        resp = await validators.deaffiliate()
        deaffiliationEpoch = await currentEpochNumber(web3)
      })

      it('should remove the validator from the group membership list', async () => {
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert.deepEqual(parsedGroup.members, [])
      })

      it("should update the member's membership history", async () => {
        const membershipHistory = parseMembershipHistory(
          await validators.getMembershipHistory(validator)
        )
        let expectedEntries = 1
        if (registrationEpoch !== additionEpoch || additionEpoch !== deaffiliationEpoch) {
          expectedEntries = 2
        }
        assert.equal(membershipHistory.epochs.length, expectedEntries)
        assertEqualBN(membershipHistory.epochs[expectedEntries - 1], deaffiliationEpoch)
        assert.equal(membershipHistory.groups.length, expectedEntries)
        assertSameAddress(membershipHistory.groups[expectedEntries - 1], NULL_ADDRESS)
        const latestBlock = await web3.eth.getBlock('latest')
        assert.equal(membershipHistory.lastRemovedFromGroupTimestamp, latestBlock.timestamp)
      })

      it('should emit the ValidatorGroupMemberRemoved event', async () => {
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
          assert.isTrue(await mockElection.isIneligible(group))
        })
      })
    })

    it('should revert when the account is not a registered validator', async () => {
      await assertTransactionRevertWithReason(
        validators.deaffiliate({ from: accounts[2] }),
        'Not a validator'
      )
    })

    it('should revert when the validator is not affiliated with a validator group', async () => {
      await validators.deaffiliate()
      await assertTransactionRevertWithReason(validators.deaffiliate(), 'not affiliated')
    })
  })

  describe('#updateEcdsaPublicKey()', () => {
    describe('when called by a registered validator', () => {
      const validator = accounts[0]
      beforeEach(async () => {
        await registerValidator(validator)
      })

      describe('when called by the registered `Accounts` contract', () => {
        beforeEach(async () => {
          await registry.setAddressFor(CeloContractName.Accounts, accounts[0])
        })

        describe('when the public key matches the signer', () => {
          let resp: any
          let newPublicKey: string
          const signer = accounts[9]
          beforeEach(async () => {
            newPublicKey = await addressToPublicKey(signer, web3.eth.sign)
            resp = await validators.updateEcdsaPublicKey(validator, signer, newPublicKey)
          })

          it('should set the validator ecdsa public key', async () => {
            await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
            const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
            assert.equal(parsedValidator.ecdsaPublicKey, newPublicKey)
          })

          it('should emit the ValidatorEcdsaPublicKeyUpdated event', async () => {
            assert.equal(resp.logs.length, 1)
            const log = resp.logs[0]
            assertContainSubset(log, {
              event: 'ValidatorEcdsaPublicKeyUpdated',
              args: {
                validator,
                ecdsaPublicKey: newPublicKey,
              },
            })
          })
        })

        describe('when the public key does not match the signer', () => {
          const signer = accounts[9]
          it('should revert', async () => {
            const newPublicKey = await addressToPublicKey(accounts[8], web3.eth.sign)
            await assertTransactionRevertWithReason(
              validators.updateEcdsaPublicKey(validator, signer, newPublicKey),
              'ECDSA key does not match signer'
            )
          })
        })
      })

      describe('when not called by the registered `Accounts` contract', () => {
        describe('when the public key matches the signer', () => {
          const signer = accounts[9]
          it('should revert', async () => {
            const newPublicKey = await addressToPublicKey(signer, web3.eth.sign)
            await assertTransactionRevertWithReason(
              validators.updateEcdsaPublicKey(validator, signer, newPublicKey),
              'only registered contract'
            )
          })
        })
      })
    })
  })

  describe('#updatePublicKeys()', () => {
    const newBlsPublicKey: string = web3.utils.randomHex(96)
    const newBlsPoP: string = web3.utils.randomHex(48)
    describe('when called by a registered validator', () => {
      const validator = accounts[0]
      beforeEach(async () => {
        await registerValidator(validator)
      })

      describe('when called by the registered `Accounts` contract', () => {
        beforeEach(async () => {
          await registry.setAddressFor(CeloContractName.Accounts, accounts[0])
        })

        describe('when the public key matches the signer', () => {
          let resp: any
          let newPublicKey: string
          const signer = accounts[9]
          beforeEach(async () => {
            newPublicKey = await addressToPublicKey(signer, web3.eth.sign)
            resp = await validators.updatePublicKeys(
              validator,
              signer,
              newPublicKey,
              newBlsPublicKey,
              newBlsPoP
            )
          })

          it('should set the validator ecdsa public key', async () => {
            await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
            const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
            assert.equal(parsedValidator.ecdsaPublicKey, newPublicKey)
          })

          it('should emit the events', async () => {
            assert.equal(resp.logs.length, 2)
            assertContainSubset(resp.logs[0], {
              event: 'ValidatorEcdsaPublicKeyUpdated',
              args: {
                validator,
                ecdsaPublicKey: newPublicKey,
              },
            })
            assertContainSubset(resp.logs[1], {
              event: 'ValidatorBlsPublicKeyUpdated',
              args: {
                validator,
                blsPublicKey: newBlsPublicKey,
              },
            })
          })
        })

        describe('when the public key does not match the signer', () => {
          const signer = accounts[9]
          it('should revert', async () => {
            const newPublicKey = await addressToPublicKey(accounts[8], web3.eth.sign)
            await assertTransactionRevertWithReason(
              validators.updatePublicKeys(
                validator,
                signer,
                newPublicKey,
                newBlsPublicKey,
                newBlsPoP
              ),
              'ECDSA key does not match signer'
            )
          })
        })
      })

      describe('when not called by the registered `Accounts` contract', () => {
        describe('when the public key matches the signer', () => {
          const signer = accounts[9]
          it('should revert', async () => {
            const newPublicKey = await addressToPublicKey(signer, web3.eth.sign)
            await assertTransactionRevertWithReason(
              validators.updatePublicKeys(
                validator,
                signer,
                newPublicKey,
                newBlsPublicKey,
                newBlsPoP
              ),
              'only registered contract'
            )
          })
        })
      })
    })
  })

  describe('#updateBlsPublicKey()', () => {
    const newBlsPublicKey = web3.utils.randomHex(96)
    const newBlsPoP = web3.utils.randomHex(48)
    describe('when called by a registered validator', () => {
      const validator = accounts[0]
      beforeEach(async () => {
        await registerValidator(validator)
      })

      describe('when the keys are the right length', () => {
        let resp: any
        beforeEach(async () => {
          resp = await validators.updateBlsPublicKey(newBlsPublicKey, newBlsPoP)
        })

        it('should set the validator bls public key', async () => {
          const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
          assert.equal(parsedValidator.blsPublicKey, newBlsPublicKey)
        })

        it('should emit the ValidatorBlsPublicKeyUpdated event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorBlsPublicKeyUpdated',
            args: {
              validator,
              blsPublicKey: newBlsPublicKey,
            },
          })
        })
      })

      describe('when the public key is not 96 bytes', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.updateBlsPublicKey(newBlsPublicKey + '01', newBlsPoP),
            'Wrong BLS public key length'
          )
        })
      })

      describe('when the proof of possession is not 48 bytes', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.updateBlsPublicKey(newBlsPublicKey, newBlsPoP + '01'),
            'Wrong BLS PoP length'
          )
        })
      })
    })
  })

  describe('#registerValidatorGroup', () => {
    const group = accounts[0]
    let resp: any
    describe('when the account is not a registered validator group', () => {
      it('should revert when vote over max number of groups set to true', async () => {
        await mockElection.setAllowedToVoteOverMaxNumberOfGroups(group, true)
        const signer = accounts[9]
        const sig = await getParsedSignatureOfAddress(web3, group, signer)
        await accountsInstance.authorizeValidatorSigner(signer, sig.v, sig.r, sig.s)
        const publicKey = await addressToPublicKey(signer, web3.eth.sign)
        await assertTransactionRevertWithReason(
          validators.registerValidator(publicKey, blsPublicKey, blsPoP),
          'Cannot vote for more than max number of groups'
        )
      })

      it('should revert when vote over max number of groups set to true', async () => {
        await mockElection.setAllowedToVoteOverMaxNumberOfGroups(group, true)
        await mockLockedGold.setAccountTotalLockedGold(group, groupLockedGoldRequirements.value)
        await assertTransactionRevertWithReason(
          validators.registerValidatorGroup(commission),
          'Cannot vote for more than max number of groups'
        )
      })

      it('should revert when vote over max number of groups set to true', async () => {
        await mockLockedGold.setAccountTotalDelegatedAmountInPercents(group, 10)
        await mockLockedGold.setAccountTotalLockedGold(group, groupLockedGoldRequirements.value)
        await assertTransactionRevertWithReason(
          validators.registerValidatorGroup(commission),
          'Cannot delegate governance power'
        )
      })

      describe('when the account meets the locked gold requirements', () => {
        beforeEach(async () => {
          await mockLockedGold.setAccountTotalLockedGold(group, groupLockedGoldRequirements.value)
          resp = await validators.registerValidatorGroup(commission)
        })

        it('should mark the account as a validator group', async () => {
          assert.isTrue(await validators.isValidatorGroup(group))
        })

        it('should add the account to the list of validator groups', async () => {
          assert.deepEqual(await validators.getRegisteredValidatorGroups(), [group])
        })

        it('should set the validator group commission', async () => {
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assertEqualBN(parsedGroup.commission, commission)
        })

        it('should set account locked gold requirements', async () => {
          const requirement = await validators.getAccountLockedGoldRequirement(group)
          assertEqualBN(requirement, groupLockedGoldRequirements.value)
        })

        it('should emit the ValidatorGroupRegistered event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupRegistered',
            args: {
              group,
              commission,
            },
          })
        })
      })

      describe('when the account does not meet the locked gold requirements', () => {
        beforeEach(async () => {
          await mockLockedGold.setAccountTotalLockedGold(
            group,
            groupLockedGoldRequirements.value.minus(11)
          )
        })

        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.registerValidatorGroup(commission),
            'Not enough locked gold'
          )
        })
      })
    })

    describe('when the account is already a registered validator', () => {
      beforeEach(async () => {
        await registerValidator(group)
      })

      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.registerValidatorGroup(commission),
          'Already registered as validator'
        )
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(group, groupLockedGoldRequirements.value)
        await validators.registerValidatorGroup(commission)
      })

      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.registerValidatorGroup(commission),
          'Already registered as group'
        )
      })
    })

    describe('when the account is already a registered validator group', () => {
      beforeEach(async () => {
        await registerValidatorGroup(group)
      })

      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.registerValidatorGroup(commission),
          'Already registered as group'
        )
      })
    })
  })

  describe('#deregisterValidatorGroup', () => {
    const index = 0
    const group = accounts[0]
    let resp: any
    describe('when the account has a registered validator group', () => {
      beforeEach(async () => {
        await registerValidatorGroup(group)
      })
      describe('when the group has never had any members', () => {
        beforeEach(async () => {
          resp = await validators.deregisterValidatorGroup(index)
        })

        it('should mark the account as not a validator group', async () => {
          assert.isFalse(await validators.isValidatorGroup(group))
        })

        it('should remove the account from the list of validator groups', async () => {
          assert.deepEqual(await validators.getRegisteredValidatorGroups(), [])
        })

        it('should reset account balance requirements', async () => {
          const requirement = await validators.getAccountLockedGoldRequirement(group)
          assertEqualBN(requirement, 0)
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
      })

      describe('when the group has had members', () => {
        const validator = accounts[1]
        beforeEach(async () => {
          await registerValidator(validator)
          await validators.affiliate(group, { from: validator })
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS)
        })

        describe('when the group no longer has members', () => {
          beforeEach(async () => {
            await validators.removeMember(validator)
          })

          describe('when it has been more than `groupLockedGoldRequirements.duration` since the validator was removed from the group', () => {
            beforeEach(async () => {
              await timeTravel(groupLockedGoldRequirements.duration.plus(1).toNumber(), web3)
              resp = await validators.deregisterValidatorGroup(index)
            })

            it('should mark the account as not a validator group', async () => {
              assert.isFalse(await validators.isValidatorGroup(group))
            })

            it('should remove the account from the list of validator groups', async () => {
              assert.deepEqual(await validators.getRegisteredValidatorGroups(), [])
            })

            it('should reset account balance requirements', async () => {
              const requirement = await validators.getAccountLockedGoldRequirement(group)
              assertEqualBN(requirement, 0)
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
          })

          describe('when it has been less than `groupLockedGoldRequirements.duration` since the validator was removed from the group', () => {
            beforeEach(async () => {
              await timeTravel(groupLockedGoldRequirements.duration.minus(1).toNumber(), web3)
            })

            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                validators.deregisterValidatorGroup(index),
                "Hasn't been empty for long enough"
              )
            })
          })
        })

        describe('when the group still has members', () => {
          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              validators.deregisterValidatorGroup(index),
              'Validator group not empty'
            )
          })
        })
      })

      it('should revert when the wrong index is provided', async () => {
        await assertTransactionRevertWithReason(
          validators.deregisterValidatorGroup(index + 1),
          'deleteElement: index out of range'
        )
      })
    })

    describe('when the account does not have a registered validator group', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.deregisterValidatorGroup(index),
          'Not a validator group'
        )
      })
    })
  })

  describe('#addMember', () => {
    const group = accounts[0]
    const validator = accounts[1]
    let resp: any
    describe('when account has a registered validator group', () => {
      beforeEach(async () => {
        await registerValidatorGroup(group)
      })
      describe('when adding a validator affiliated with the group', () => {
        let registrationEpoch: number
        beforeEach(async () => {
          await registerValidator(validator)
          registrationEpoch = await currentEpochNumber(web3)
          await validators.affiliate(group, { from: validator })
        })

        describe('when the group meets the locked gold requirements', () => {
          describe('when the validator meets the locked gold requirements', () => {
            let additionEpoch: number
            beforeEach(async () => {
              resp = await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS)
              additionEpoch = await currentEpochNumber(web3)
            })

            it('should add the member to the list of members', async () => {
              const parsedGroup = parseValidatorGroupParams(
                await validators.getValidatorGroup(group)
              )
              assert.deepEqual(parsedGroup.members, [validator])
            })

            it("should update the groups's size history", async () => {
              const parsedGroup = parseValidatorGroupParams(
                await validators.getValidatorGroup(group)
              )
              assert.equal(parsedGroup.sizeHistory.length, 1)
              assertEqualBN(
                parsedGroup.sizeHistory[0],
                (await web3.eth.getBlock('latest')).timestamp
              )
            })

            it("should update the member's membership history", async () => {
              const expectedEntries = registrationEpoch === additionEpoch ? 1 : 2
              const membershipHistory = parseMembershipHistory(
                await validators.getMembershipHistory(validator)
              )
              assert.equal(membershipHistory.epochs.length, expectedEntries)
              assertEqualBN(membershipHistory.epochs[expectedEntries - 1], additionEpoch)
              assert.equal(membershipHistory.groups.length, expectedEntries)
              assertSameAddress(membershipHistory.groups[expectedEntries - 1], group)
            })

            it('should mark the group as eligible', async () => {
              assert.isTrue(await mockElection.isEligible(group))
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

            describe('when the group has no room to add another member', () => {
              beforeEach(async () => {
                await validators.setMaxGroupSize(1)
                await registerValidator(accounts[2])
                await validators.affiliate(group, { from: accounts[2] })
              })

              it('should revert', async () => {
                await assertTransactionRevertWithReason(
                  validators.addMember(accounts[2]),
                  'group would exceed maximum size'
                )
              })
            })

            describe('when adding many validators affiliated with the group', () => {
              it("should update the groups's size history and balance requirements", async () => {
                const expectedSizeHistory = parseValidatorGroupParams(
                  await validators.getValidatorGroup(group)
                ).sizeHistory
                assert.equal(expectedSizeHistory.length, 1)
                for (let i = 2; i < maxGroupSize.toNumber() + 1; i++) {
                  const numMembers = i
                  const validator1 = accounts[i]
                  await registerValidator(validator1)
                  await validators.affiliate(group, { from: validator1 })
                  await mockLockedGold.setAccountTotalLockedGold(
                    group,
                    groupLockedGoldRequirements.value.times(numMembers)
                  )
                  await validators.addMember(validator1)
                  expectedSizeHistory.push((await web3.eth.getBlock('latest')).timestamp)
                  const parsedGroup = parseValidatorGroupParams(
                    await validators.getValidatorGroup(group)
                  )
                  assert.deepEqual(
                    parsedGroup.sizeHistory.map((x) => x.toString()),
                    expectedSizeHistory.map((x) => x.toString())
                  )
                  const requirement = await validators.getAccountLockedGoldRequirement(group)
                  assertEqualBN(requirement, groupLockedGoldRequirements.value.times(numMembers))
                }
              })
            })
          })

          describe('when the validator does not meet the locked gold requirements', () => {
            beforeEach(async () => {
              await mockLockedGold.setAccountTotalLockedGold(
                validator,
                validatorLockedGoldRequirements.value.minus(11)
              )
            })

            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS),
                'Validator requirements not met'
              )
            })
          })
        })

        describe('when the group does not meet the locked gold requirements', () => {
          describe('when the group does not have a member', () => {
            beforeEach(async () => {
              await mockLockedGold.setAccountTotalLockedGold(
                group,
                groupLockedGoldRequirements.value.minus(11)
              )
            })

            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS),
                'Group requirements not met'
              )
            })
          })

          describe('when the group already has a member', () => {
            const validator2 = accounts[2]
            beforeEach(async () => {
              await mockLockedGold.setAccountTotalLockedGold(
                group,
                groupLockedGoldRequirements.value.times(2).minus(11)
              )
              await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS)
              await registerValidator(validator2)
              await validators.affiliate(group, { from: validator2 })
            })

            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                validators.addMember(validator2),
                'Group requirements not met'
              )
            })
          })
        })
      })

      describe('when adding a validator not affiliated with the group', () => {
        beforeEach(async () => {
          await registerValidator(validator)
        })

        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS),
            'Not affiliated to group'
          )
        })
      })
    })

    describe('when the account does not have a registered validator group', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS),
          'Not validator and group'
        )
      })
    })

    describe('when the validator is already a member of the group', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.addMember(validator),
          'Validator group empty'
        )
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
      const membershipHistory = parseMembershipHistory(
        await validators.getMembershipHistory(validator)
      )
      const expectedEpoch = await currentEpochNumber(web3)

      // Depending on test timing, we may or may not span an epoch boundary between registration
      // and removal.
      const numEntries = membershipHistory.epochs.length
      assert.isTrue(numEntries === 1 || numEntries === 2)
      assert.equal(membershipHistory.groups.length, numEntries)
      if (numEntries === 1) {
        assertEqualBN(membershipHistory.epochs[0], expectedEpoch)
        assertSameAddress(membershipHistory.groups[0], NULL_ADDRESS)
      } else {
        assertEqualBN(membershipHistory.epochs[1], expectedEpoch)
        assertSameAddress(membershipHistory.groups[1], NULL_ADDRESS)
      }
      const latestBlock = await web3.eth.getBlock('latest')
      assert.equal(membershipHistory.lastRemovedFromGroupTimestamp, latestBlock.timestamp)
    })

    it("should update the group's size history", async () => {
      await validators.removeMember(validator)
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assert.equal(parsedGroup.sizeHistory.length, 2)
      assertEqualBN(parsedGroup.sizeHistory[1], (await web3.eth.getBlock('latest')).timestamp)
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
      await assertTransactionRevertWithReason(
        validators.removeMember(validator, { from: accounts[2] }),
        'is not group and validator'
      )
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertTransactionRevertWithReason(
        validators.removeMember(accounts[2]),
        'is not group and validator'
      )
    })

    describe('when the validator is not a member of the validator group', () => {
      beforeEach(async () => {
        await validators.deaffiliate({ from: validator })
      })

      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.removeMember(validator),
          'Not affiliated to group'
        )
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
      await assertTransactionRevertWithReason(
        validators.reorderMember(validator2, validator1, NULL_ADDRESS, { from: accounts[2] }),
        'Not a group'
      )
    })

    it('should revert when the member is not a registered validator', async () => {
      await assertTransactionRevertWithReason(
        validators.reorderMember(accounts[3], validator1, NULL_ADDRESS),
        'Not a validator'
      )
    })

    describe('when the validator is not a member of the validator group', () => {
      beforeEach(async () => {
        await validators.deaffiliate({ from: validator2 })
      })

      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.reorderMember(validator2, validator1, NULL_ADDRESS),
          'Not a member of the group'
        )
      })
    })
  })

  describe('#setNextCommissionUpdate()', () => {
    describe('when the commission is different', () => {
      const newCommission = commission.plus(1)
      const group = accounts[0]

      describe('when called by a registered validator group', () => {
        let resp: any

        beforeEach(async () => {
          await registerValidatorGroup(group)
          resp = await validators.setNextCommissionUpdate(newCommission)
        })

        it('should NOT set the validator group commission', async () => {
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assertEqualBN(parsedGroup.commission, commission)
        })

        it('should set the validator group next commission', async () => {
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assertEqualBN(parsedGroup.nextCommission, newCommission)
        })

        it('should emit the ValidatorGroupCommissionUpdateQueued event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          const blockNumber = log.blockNumber
          assertContainSubset(log, {
            event: 'ValidatorGroupCommissionUpdateQueued',
            args: {
              group,
              commission: newCommission,
              activationBlock: commissionUpdateDelay.plus(blockNumber),
            },
          })
        })
      })

      describe('when the commission is the same', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.setNextCommissionUpdate(commission),
            'Not a validator group'
          )
        })
      })

      describe('when the commission is greater than one', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            validators.setNextCommissionUpdate(fixed1.plus(1)),
            'Not a validator group'
          )
        })
      })
    })
  })
  describe('#updateCommission()', () => {
    const group = accounts[0]
    const newCommission = commission.plus(1)

    beforeEach(async () => {
      await registerValidatorGroup(group)
    })

    describe('when activationBlock has passed', () => {
      let resp: any

      beforeEach(async () => {
        await validators.setNextCommissionUpdate(newCommission)
        await mineBlocks(commissionUpdateDelay.toNumber(), web3)
        resp = await validators.updateCommission()
      })

      it('should set the validator group commission', async () => {
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assertEqualBN(parsedGroup.commission, newCommission)
      })

      it('should emit the ValidatorGroupCommissionUpdated event', async () => {
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertContainSubset(log, {
          event: 'ValidatorGroupCommissionUpdated',
          args: {
            group,
            commission: newCommission,
          },
        })
      })
    })

    describe('when activationBlock has NOT passed', () => {
      it('should revert', async () => {
        await validators.setNextCommissionUpdate(newCommission)
        await assertTransactionRevertWithReason(
          validators.updateCommission(),
          "Can't apply commission update yet"
        )
      })
    })

    describe('when NO Commission has been queued', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.updateCommission(),
          'No commission update queued'
        )
      })
    })

    describe('when try to apply an already applied Commission', () => {
      it('should revert', async () => {
        await validators.setNextCommissionUpdate(newCommission)
        await mineBlocks(commissionUpdateDelay.toNumber(), web3)
        await validators.updateCommission()
        await assertTransactionRevertWithReason(
          validators.updateCommission(),
          'No commission update queued'
        )
      })
    })
  })

  describe('#calculateEpochScore', () => {
    describe('when uptime is in the interval [0, 1.0]', () => {
      it('should calculate the score correctly', async () => {
        // Compare expected and actual to 8 decimal places.
        const uptime = new BigNumber(0.99)
        const grace = await validators.downtimeGracePeriod()
        assertEqualDpBN(
          fromFixed(await validators.calculateEpochScore(toFixed(uptime))),
          calculateScore(uptime, grace),
          8
        )
        assertEqualDpBN(
          fromFixed(await validators.calculateEpochScore(new BigNumber(0))),
          calculateScore(new BigNumber(0), grace),
          8
        )

        assertEqualDpBN(fromFixed(await validators.calculateEpochScore(fixed1)), 1, 8)
      })
    })

    describe('when uptime > 1.0', () => {
      const uptime = new BigNumber(1.01)
      it('should revert', async () => {
        await assertRevert(validators.calculateEpochScore(toFixed(uptime)))
      })
    })
  })

  describe('#calculateGroupEpochScore', () => {
    describe('when all uptimes are in the interval [0, 1.0]', () => {
      const testGroupUptimeCalculation = async (_uptimes) => {
        const gracePeriod = await validators.downtimeGracePeriod()
        const expected = _uptimes
          .map((uptime) => new BigNumber(uptime))
          .map((uptime) => calculateScore(uptime, gracePeriod))
          .reduce((sum, n) => sum.plus(n))
          .div(_uptimes.length)

        it('should calculate the group score correctly', async () => {
          assertEqualDpBN(
            fromFixed(await validators.calculateGroupEpochScore(_uptimes.map(toFixed))),
            expected,
            8
          )
        })
      }

      // 5 random uptimes between zero and one.
      const uptimes = [0.969, 0.485, 0.456, 0.744, 0.257]
      for (const count of [1, 3, 5]) {
        it(`when there are ${count} validators in the group`, async () => {
          await testGroupUptimeCalculation(uptimes.slice(0, count))
        })
      }

      it('when only zeros are provided', async () => {
        await testGroupUptimeCalculation([0, 0, 0, 0])
      })

      it('when there are zeros in the uptimes', async () => {
        await testGroupUptimeCalculation([0.75, 0, 0.95])
      })

      describe('when there are more than maxGroupSize uptimes', () => {
        it('should revert', async () => {
          await assertRevert(
            validators.calculateGroupEpochScore([0.9, 0.9, 0.9, 0.9, 0.9, 0.9].map(toFixed))
          )
        })
      })
    })

    describe('when no uptimes are provided', () => {
      it('should revert', async () => {
        await assertRevert(validators.calculateGroupEpochScore([]))
      })
    })

    describe('when uptimes are > 1.0', () => {
      it('should revert', async () => {
        await assertRevert(validators.calculateGroupEpochScore([0.95, 1.01, 0.99].map(toFixed)))
      })
    })
  })

  describe('#updateValidatorScoreFromSigner', () => {
    const validator = accounts[0]
    let grace: BigNumber

    beforeEach(async () => {
      await registerValidator(validator)
      grace = await validators.downtimeGracePeriod()
    })

    describe('when 0 <= uptime <= 1.0', () => {
      const uptime = new BigNumber(0.99)

      let epochScore: BigNumber
      let adjustmentSpeed: BigNumber

      beforeEach(async () => {
        epochScore = calculateScore(uptime, grace)
        adjustmentSpeed = fromFixed(validatorScoreParameters.adjustmentSpeed)
        await validators.updateValidatorScoreFromSigner(validator, toFixed(uptime))
      })

      it('should update the validator score', async () => {
        const expectedScore = adjustmentSpeed.times(epochScore).decimalPlaces(12)
        const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
        assertEqualBN(parsedValidator.score, toFixed(expectedScore))
      })

      describe('when the validator already has a non-zero score', () => {
        beforeEach(async () => {
          await validators.updateValidatorScoreFromSigner(validator, toFixed(uptime))
        })

        it('should update the validator score', async () => {
          let expectedScore = adjustmentSpeed.times(epochScore).decimalPlaces(12)
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
        await assertTransactionRevertWithReason(
          validators.updateValidatorScoreFromSigner(validator, toFixed(uptime)),
          'Uptime cannot be larger than one'
        )
      })
    })
  })

  describe('#updateMembershipHistory', () => {
    const validator = accounts[0]
    const groups = accounts.slice(1, -1)
    let validatorRegistrationEpochNumber: number
    beforeEach(async () => {
      await registerValidator(validator)
      validatorRegistrationEpochNumber = await currentEpochNumber(web3)
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
          await mineToNextEpoch(web3)
          const epochNumber = await currentEpochNumber(web3)
          let group = groups[0]
          await validators.affiliate(group)
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: group,
          })
          let membershipHistory = await validators.getMembershipHistory(validator)
          expectedMembershipHistoryGroups.push(group)
          expectedMembershipHistoryEpochs.push(new BigNumber(epochNumber))
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
          await mineToNextEpoch(web3)
          const epochNumber = await currentEpochNumber(web3)
          await validators.affiliate(groups[i])
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: groups[i],
          })
          expectedMembershipHistoryGroups.push(groups[i])
          expectedMembershipHistoryEpochs.push(new BigNumber(epochNumber))
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
    const groups = accounts.slice(1, -1)
    beforeEach(async () => {
      await registerValidator(validator)
      for (const group of groups) {
        await registerValidatorGroup(group)
      }
    })

    describe('when changing groups more times than membership history length', () => {
      it('should always return the correct membership for the last epoch', async () => {
        for (let i = 0; i < membershipHistoryLength.plus(1).toNumber(); i++) {
          await mineToNextEpoch(web3)

          await validators.affiliate(groups[i])
          await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
            from: groups[i],
          })

          if (i === 0) {
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

  describe('#getAccountLockedGoldRequirement', () => {
    describe('when a validator group has added members', () => {
      const group = accounts[0]
      const numMembers = 5
      let actualRequirements: BigNumber[]
      beforeEach(async () => {
        actualRequirements = []
        await registerValidatorGroup(group)
        for (let i = 1; i < numMembers + 1; i++) {
          const validator = accounts[i]
          await registerValidator(validator)
          await validators.affiliate(group, { from: validator })
          await mockLockedGold.setAccountTotalLockedGold(
            group,
            groupLockedGoldRequirements.value.times(i)
          )
          if (i === 1) {
            await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS)
          } else {
            await validators.addMember(validator)
          }
          actualRequirements.push(await validators.getAccountLockedGoldRequirement(group))
        }
      })

      it('should increase the requirement with each added member', async () => {
        for (let i = 0; i < numMembers; i++) {
          assertEqualBN(actualRequirements[i], groupLockedGoldRequirements.value.times(i + 1))
        }
      })

      describe('when a validator group is removing members', () => {
        let removalTimestamps: number[]
        beforeEach(async () => {
          removalTimestamps = []
          for (let i = 1; i < numMembers + 1; i++) {
            const validator = accounts[i]
            await validators.removeMember(validator)
            removalTimestamps.push((await web3.eth.getBlock('latest')).timestamp)
            // Space things out.
            await timeTravel(47, web3)
          }
        })

        it('should decrease the requirement `duration`+1 seconds after removal', async () => {
          for (let i = 0; i < numMembers; i++) {
            assertEqualBN(
              await validators.getAccountLockedGoldRequirement(group),
              groupLockedGoldRequirements.value.times(numMembers - i)
            )
            const removalTimestamp = removalTimestamps[i]
            const requirementExpiry = groupLockedGoldRequirements.duration.plus(removalTimestamp)
            const currentTimestamp = (await web3.eth.getBlock('latest')).timestamp
            await timeTravel(requirementExpiry.minus(currentTimestamp).plus(1).toNumber(), web3)
          }
        })
      })
    })
  })

  describe('#distributeEpochPaymentsFromSigner', () => {
    const validator = accounts[0]
    const group = accounts[1]
    const delegatee = accounts[2]
    const delegatedFraction = toFixed(0.1)

    const maxPayment = new BigNumber(20122394876)
    let mockStableToken: MockStableTokenInstance
    beforeEach(async () => {
      await registerValidatorGroupWithMembers(group, [validator])
      mockStableToken = await MockStableToken.new()
      await registry.setAddressFor(CeloContractName.StableToken, mockStableToken.address)
      // Fast-forward to the next epoch, so that the getMembershipInLastEpoch(validator) == group
      await mineToNextEpoch(web3)
      await mockLockedGold.addSlasher(accounts[2])

      await accountsInstance.setPaymentDelegation(delegatee, delegatedFraction)
    })

    describe('when the validator score is non-zero', () => {
      let ret: BigNumber
      let expectedScore: BigNumber
      let expectedTotalPayment: BigNumber
      let expectedGroupPayment: BigNumber
      let expectedValidatorPayment: BigNumber
      let expectedDelegatedPayment: BigNumber

      beforeEach(async () => {
        const uptime = new BigNumber(0.99)
        const adjustmentSpeed = fromFixed(validatorScoreParameters.adjustmentSpeed)

        expectedScore = adjustmentSpeed.times(
          calculateScore(new BigNumber(0.99), await validators.downtimeGracePeriod())
        )
        expectedTotalPayment = expectedScore.times(maxPayment).dp(0, BigNumber.ROUND_FLOOR)
        expectedGroupPayment = expectedTotalPayment
          .times(fromFixed(commission))
          .dp(0, BigNumber.ROUND_FLOOR)
        const remainingPayment = expectedTotalPayment.minus(expectedGroupPayment)
        expectedDelegatedPayment = remainingPayment
          .times(fromFixed(delegatedFraction))
          .dp(0, BigNumber.ROUND_FLOOR)
        expectedValidatorPayment = remainingPayment.minus(expectedDelegatedPayment)

        await validators.updateValidatorScoreFromSigner(validator, toFixed(uptime))
      })

      describe('when the validator and group meet the balance requirements', () => {
        beforeEach(async () => {
          ret = await validators.distributeEpochPaymentsFromSigner.call(validator, maxPayment)
          await validators.distributeEpochPaymentsFromSigner(validator, maxPayment)
        })

        it('should pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), expectedValidatorPayment)
        })

        it('should pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), expectedGroupPayment)
        })

        it('should pay the delegatee', async () => {
          assertEqualBN(await mockStableToken.balanceOf(delegatee), expectedDelegatedPayment)
        })

        it('should return the expected total payment', async () => {
          assertEqualBN(ret, expectedTotalPayment)
        })
      })

      describe('when the validator and group meet the balance requirements and no payment is delegated', async () => {
        beforeEach(async () => {
          expectedDelegatedPayment = new BigNumber(0)
          expectedValidatorPayment = expectedTotalPayment.minus(expectedGroupPayment)

          await accountsInstance.deletePaymentDelegation()

          ret = await validators.distributeEpochPaymentsFromSigner.call(validator, maxPayment)
          await validators.distributeEpochPaymentsFromSigner(validator, maxPayment)
        })

        it('should pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), expectedValidatorPayment)
        })

        it('should pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), expectedGroupPayment)
        })

        it('should return the expected total payment', async () => {
          assertEqualBN(ret, expectedTotalPayment)
        })
      })

      describe('when slashing multiplier is halved', () => {
        let halfExpectedTotalPayment: BigNumber
        let halfExpectedGroupPayment: BigNumber
        let halfExpectedValidatorPayment: BigNumber
        let halfExpectedDelegatedPayment: BigNumber

        beforeEach(async () => {
          halfExpectedTotalPayment = expectedScore
            .times(maxPayment)
            .div(2)
            .dp(0, BigNumber.ROUND_FLOOR)
          halfExpectedGroupPayment = halfExpectedTotalPayment
            .times(fromFixed(commission))
            .dp(0, BigNumber.ROUND_FLOOR)
          const remainingPayment = halfExpectedTotalPayment.minus(halfExpectedGroupPayment)
          halfExpectedDelegatedPayment = remainingPayment
            .times(fromFixed(delegatedFraction))
            .dp(0, BigNumber.ROUND_FLOOR)
          halfExpectedValidatorPayment = remainingPayment.minus(halfExpectedDelegatedPayment)

          await validators.halveSlashingMultiplier(group, { from: accounts[2] })
          ret = await validators.distributeEpochPaymentsFromSigner.call(validator, maxPayment)
          await validators.distributeEpochPaymentsFromSigner(validator, maxPayment)
        })

        it('should pay the validator only half', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), halfExpectedValidatorPayment)
        })

        it('should pay the group only half', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), halfExpectedGroupPayment)
        })

        it('should pay the delegatee only half', async () => {
          assertEqualBN(await mockStableToken.balanceOf(delegatee), halfExpectedDelegatedPayment)
        })

        it('should return the expected total payment', async () => {
          assertEqualBN(ret, halfExpectedTotalPayment)
        })
      })

      describe('when the validator does not meet the balance requirements', () => {
        beforeEach(async () => {
          await mockLockedGold.setAccountTotalLockedGold(
            validator,
            validatorLockedGoldRequirements.value.minus(11)
          )
          ret = await validators.distributeEpochPaymentsFromSigner.call(validator, maxPayment)
          await validators.distributeEpochPaymentsFromSigner(validator, maxPayment)
        })

        it('should not pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), 0)
        })

        it('should not pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), 0)
        })

        it('should not pay the delegatee', async () => {
          assertEqualBN(await mockStableToken.balanceOf(delegatee), 0)
        })

        it('should return zero', async () => {
          assertEqualBN(ret, 0)
        })
      })

      describe('when the group does not meet the balance requirements', () => {
        beforeEach(async () => {
          await mockLockedGold.setAccountTotalLockedGold(
            group,
            groupLockedGoldRequirements.value.minus(11)
          )
          ret = await validators.distributeEpochPaymentsFromSigner.call(validator, maxPayment)
          await validators.distributeEpochPaymentsFromSigner(validator, maxPayment)
        })

        it('should not pay the validator', async () => {
          assertEqualBN(await mockStableToken.balanceOf(validator), 0)
        })

        it('should not pay the group', async () => {
          assertEqualBN(await mockStableToken.balanceOf(group), 0)
        })

        it('should not pay the delegatee', async () => {
          assertEqualBN(await mockStableToken.balanceOf(delegatee), 0)
        })

        it('should return zero', async () => {
          assertEqualBN(ret, 0)
        })
      })
    })
  })

  describe('#forceDeaffiliateIfValidator', () => {
    const validator = accounts[0]
    const group = accounts[1]

    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
      await validators.affiliate(group)
      await mockLockedGold.addSlasher(accounts[2])
    })

    describe('when the sender is one of the whitelisted slashing addresses', () => {
      it('should succeed when the account is manually added', async () => {
        await validators.forceDeaffiliateIfValidator(validator, { from: accounts[2] })
        const parsedValidator = parseValidatorParams(await validators.getValidator(validator))
        assert.equal(parsedValidator.affiliation, NULL_ADDRESS)
      })
    })

    describe('when the sender is not an approved address', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          validators.forceDeaffiliateIfValidator(validator),
          'Only registered slasher can call'
        )
      })
    })
  })

  describe('#groupMembershipInEpoch', () => {
    const validator = accounts[0]
    const groups = accounts.slice(1, -1)
    const gapSize = 3
    // Multiple of gapSize
    const totalEpochs = 24
    // Stored index on chain
    let contractIndex = 0

    describe('when the validator is added to different groups with gaps in between epochs', () => {
      let epochs = []

      beforeEach(async () => {
        // epochs stores [epochNumber, group] of the corresponding i + 1 indexed entry on chain
        // i + 1 because registering validators adds a dummy null address as the first entry
        epochs = []
        await registerValidator(validator)
        contractIndex = 1
        for (const group of groups) {
          await registerValidatorGroup(group)
        }
        // Start at 1 since we can't start with deaffiliate
        for (let i = 1; i < totalEpochs; i++) {
          await mineToNextEpoch(web3)

          const epochNumber = await currentEpochNumber(web3)
          if (i % gapSize === 0) {
            const group =
              i % (gapSize * gapSize) !== 0
                ? groups[Math.floor(i / gapSize) % groups.length]
                : NULL_ADDRESS
            contractIndex += 1
            // Current epochNumber is 1 greater since we just called `mineBlocks`
            epochs.push([epochNumber + 1, group])
            // deaffiliate every gapSize^2 entry
            if (i % (gapSize * gapSize) !== 0) {
              await validators.affiliate(group)
              await validators.addFirstMember(validator, NULL_ADDRESS, NULL_ADDRESS, {
                from: group,
              })
            } else {
              await validators.deaffiliate()
            }
          }
        }
      })

      it('should correctly get the group address for exact epoch numbers', async () => {
        for (let i = 0; i < epochs.length; i++) {
          const group = epochs[i][1]
          if (epochs.length - i <= membershipHistoryLength.toNumber()) {
            assert.equal(
              await validators.groupMembershipInEpoch(validator, epochs[i][0], 1 + i),
              group
            )
          } else {
            await assertRevert(validators.groupMembershipInEpoch(validator, epochs[i][0], 1 + i))
          }
        }
      })

      describe('when called with various malformed inputs', () => {
        it('should revert when epochNumber at given index is greater than provided epochNumber', async () => {
          await assertRevert(
            validators.groupMembershipInEpoch(
              validator,
              epochs[epochs.length - 2][0],
              contractIndex
            )
          )
        })

        it("should revert when epochNumber fits into a different index's bucket", async () => {
          await assertRevert(
            validators.groupMembershipInEpoch(
              validator,
              epochs[epochs.length - 1][0],
              contractIndex - 2
            )
          )
        })

        it("should revert when epochNumber is greater than the chain's current epochNumber", async () => {
          const epochNumber = await currentEpochNumber(web3)
          await assertRevert(
            validators.groupMembershipInEpoch(validator, epochNumber + 1, contractIndex)
          )
        })

        it('should revert when provided index is greater than greatest index on chain', async () => {
          const epochNumber = await currentEpochNumber(web3)
          await assertRevert(
            validators.groupMembershipInEpoch(validator, epochNumber, contractIndex + 1)
          )
        })

        it('should revert when provided index is less than `tail` index on chain', async () => {
          await assertRevert(
            validators.groupMembershipInEpoch(
              validator,
              epochs[epochs.length - membershipHistoryLength.toNumber() - 1][0],
              contractIndex - membershipHistoryLength.toNumber()
            )
          )
        })
      })
    })
  })

  describe('#halveSlashingMultiplier', async () => {
    const group = accounts[1]

    beforeEach(async () => {
      await registerValidatorGroup(group)
    })

    describe('when run from an approved address', async () => {
      beforeEach(async () => {
        await mockLockedGold.addSlasher(accounts[2])
      })

      it('should halve the slashing multiplier of a group', async () => {
        let multiplier = 1.0
        for (let i = 0; i < 10; i++) {
          await validators.halveSlashingMultiplier(group, { from: accounts[2] })
          multiplier /= 2
          const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
          assertEqualBN(parsedGroup.slashingMultiplier, toFixed(multiplier))
        }
      })

      it('should update `lastSlashed timestamp', async () => {
        let parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        const initialTimestamp = parsedGroup.lastSlashed
        await validators.halveSlashingMultiplier(group, { from: accounts[2] })
        parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assert(parsedGroup.lastSlashed > initialTimestamp)
      })

      it('should revert when called by non-slasher', async () => {
        await assertTransactionRevertWithReason(
          validators.halveSlashingMultiplier(group, { from: accounts[0] }),
          'Only registered slasher can call'
        )
      })
    })
  })

  describe('#resetSlashingMultiplier', async () => {
    const validator = accounts[0]
    const group = accounts[1]

    beforeEach(async () => {
      await registerValidator(validator)
      await registerValidatorGroup(group)
      await validators.affiliate(group)
      await mockLockedGold.addSlasher(accounts[2])
      await validators.halveSlashingMultiplier(group, { from: accounts[2] })
      const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
      assertEqualBN(parsedGroup.slashingMultiplier, toFixed(0.5))
    })

    describe('when the slashing multiplier is reset after reset period', async () => {
      it('should return to default 1.0', async () => {
        await timeTravel(slashingMultiplierResetPeriod, web3)
        await validators.resetSlashingMultiplier({ from: group })
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assertEqualBN(parsedGroup.slashingMultiplier, toFixed(1))
      })
    })

    describe('when the slashing multiplier is reset before reset period', async () => {
      it('should revert', async () => {
        await timeTravel(slashingMultiplierResetPeriod - 10, web3)
        await assertTransactionRevertWithReason(
          validators.resetSlashingMultiplier({ from: group }),
          '`resetSlashingMultiplier` called before resetPeriod expired'
        )
      })
    })

    describe('when the slashing reset period is changed', async () => {
      it('should be read properly', async () => {
        const newPeriod = 60 * 60 * 24 * 10 // 10 days
        await validators.setSlashingMultiplierResetPeriod(newPeriod)
        await timeTravel(newPeriod, web3)
        await validators.resetSlashingMultiplier({ from: group })
        const parsedGroup = parseValidatorGroupParams(await validators.getValidatorGroup(group))
        assertEqualBN(parsedGroup.slashingMultiplier, toFixed(1))
      })
    })
  })
})
