import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertEqualBNArray,
  assertEqualDpBN,
  assertRevert,
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
const Validators: ValidatorsMockContract = artifacts.require('ValidatorsMock')
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

const HOUR = 60 * 60
const DAY = 24 * HOUR

contract('Validators', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: ValidatorsMockInstance
  let registry: RegistryInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance

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
    '0xfdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923955'
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

  // describe('#initialize()', () => {})

  // describe('#setMembershipHistoryLength()', () => {})

  // describe('#setMaxGroupSize()', () => {})

  // describe('#setGroupLockedGoldRequirements()', () => {})

  // describe('#setValidatorLockedGoldRequirements()', () => {})

  // describe('#setValidatorScoreParameters()', () => {})

  // describe('#setMaxGroupSize()', () => {}) // duplicate

  // describe('#registerValidator', () => {})

  // describe('#deregisterValidator', () => {})

  // describe('#affiliate', () => {})

  // describe('#deaffiliate', () => {})

  // describe('#updateEcdsaPublicKey()', () => {})

  // describe('#updatePublicKeys()', () => {})

  // describe('#updateBlsPublicKey()', () => {})

  // describe('#registerValidatorGroup', () => {})

  // describe('#deregisterValidatorGroup', () => {})

  // describe('#addMember', () => {})

  // describe('#removeMember', () => {})

  // describe('#reorderMember', () => {})

  // describe('#setNextCommissionUpdate()', () => {})
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
