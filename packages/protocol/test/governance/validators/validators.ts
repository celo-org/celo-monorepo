import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertRevert,
  assertTransactionRevertWithReason,
  currentEpochNumber,
  mineToNextEpoch,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
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
  // describe('#updateCommission()', () => {})

  // describe('#calculateEpochScore', () => {})

  // describe('#calculateGroupEpochScore', () => {})

  // describe('#updateValidatorScoreFromSigner', () => {})

  // describe('#updateMembershipHistory', () => {})

  // describe('#getMembershipInLastEpoch', () => {})

  // describe('#getEpochSize', () => {})

  // describe('#getAccountLockedGoldRequirement', () => {})

  // describe('#distributeEpochPaymentsFromSigner', () => {})

  // describe('#forceDeaffiliateIfValidator', () => {})

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
