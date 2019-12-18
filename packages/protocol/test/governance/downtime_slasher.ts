import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert, NULL_ADDRESS, assertContainSubset } from '@celo/protocol/lib/test-utils'
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
  RegistryContract,
  RegistryInstance,
  TestDowntimeSlasherContract,
  TestDowntimeSlasherInstance,
  ValidatorsTestContract,
  ValidatorsTestInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const Validators: ValidatorsTestContract = artifacts.require('ValidatorsTest')
const DowntimeSlasher: TestDowntimeSlasherContract = artifacts.require('TestDowntimeSlasher')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Validators.numberFormat = 'BigNumber'
// @ts-ignore
DowntimeSlasher.numberFormat = 'BigNumber'

const HOUR = 60 * 60
const DAY = 24 * HOUR
// Hard coded in ganache.
const EPOCH = 100

contract('DowntimeSlasher', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: ValidatorsTestInstance
  let registry: RegistryInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDowntimeSlasherInstance

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
  const membershipHistoryLength = new BigNumber(5)
  const maxGroupSize = new BigNumber(5)

  // A random 64 byte hex string.
  const blsPublicKey =
    '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00'
  const blsPoP =
    '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900'
  const commission = toFixed(1 / 100)

  const registerValidator = async (address: string) => {
    await mockLockedGold.setAccountTotalLockedGold(address, validatorLockedGoldRequirements.value)
    const publicKey = await addressToPublicKey(address, web3.eth.sign)
    await validators.registerValidator(
      // @ts-ignore bytes type
      publicKey,
      // @ts-ignore bytes type
      blsPublicKey,
      // @ts-ignore bytes type
      blsPoP,
      { from: address }
    )
  }

  const registerValidatorGroup = async (group: string) => {
    await mockLockedGold.setAccountTotalLockedGold(
      group,
      groupLockedGoldRequirements.value.multipliedBy(maxGroupSize)
    )
    await validators.registerValidatorGroup(commission, { from: group })
  }

  const registerValidatorGroupWithMembers = async (group: string, members: string[]) => {
    await registerValidatorGroup(group)
    for (const address of members) {
      await registerValidator(address)
      await validators.affiliate(group, { from: address })
      if (address === members[0]) {
        await validators.addFirstMember(address, NULL_ADDRESS, NULL_ADDRESS, { from: group })
      } else {
        await validators.addMember(address, { from: group })
      }
    }
  }

  const nonOwner = accounts[1]
  const validator = accounts[1]

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockElection = await MockElection.new()
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await Validators.new()
    slasher = await DowntimeSlasher.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await registry.setAddressFor(CeloContractName.DoubleSigningSlasher, slasher.address)
    await registry.setAddressFor(CeloContractName.DowntimeSlasher, accounts[5])
    await registry.setAddressFor(CeloContractName.GovernanceSlasher, accounts[6])
    await registry.setAddressFor(CeloContractName.Governance, accounts[7])
    await validators.initialize(
      registry.address,
      groupLockedGoldRequirements.value,
      groupLockedGoldRequirements.duration,
      validatorLockedGoldRequirements.value,
      validatorLockedGoldRequirements.duration,
      validatorScoreParameters.exponent,
      validatorScoreParameters.adjustmentSpeed,
      membershipHistoryLength,
      maxGroupSize
    )
    const group = accounts[0]
    await registerValidatorGroupWithMembers(group, [validator])
    await registerValidatorGroupWithMembers(accounts[3], [accounts[4]])
    await slasher.initialize(registry.address, 10000, 100, 3)
    await mockLockedGold.incrementNonvotingAccountBalance(validator, 50000)
    await mockLockedGold.incrementNonvotingAccountBalance(group, 60000)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await slasher.owner()
      assert.equal(owner, accounts[0])
    })
    it('should have set slashing incentives', async () => {
      const res = await slasher.slashingIncentives()
      assert.equal(res[0].toNumber(), 10000)
      assert.equal(res[1].toNumber(), 100)
    })
    it('should have set slashable downtime', async () => {
      const res = await slasher.slashableDowntime()
      assert.equal(res.toNumber(), 3)
    })
    it('can only be called once', async () => {
      await assertRevert(slasher.initialize(registry.address, 10000, 100, 2))
    })
  })

  describe('#setSlashingIncentives()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setSlashingIncentives(123, 67, { from: nonOwner }))
    })
    it('should have set slashing incentives', async () => {
      await slasher.setSlashingIncentives(123, 67)
      const res = await slasher.slashingIncentives()
      assert.equal(res[0].toNumber(), 123)
      assert.equal(res[1].toNumber(), 67)
    })
    it('reward cannot be larger than penalty', async () => {
      await assertRevert(slasher.setSlashingIncentives(123, 678))
    })
    it('should emit the corresponding event', async () => {
      const resp = await slasher.setSlashingIncentives(123, 67)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'SlashingIncentivesSet',
        args: {
          penalty: new BigNumber(123),
          reward: new BigNumber(67),
        },
      })
    })
  })

  describe('#setSlashableDowntime()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setSlashableDowntime(23, { from: nonOwner }))
    })
    it('slashable downtime has to be smaller than epoch length', async () => {
      await assertRevert(slasher.setSlashableDowntime(123))
    })
    it('should have set slashable downtime', async () => {
      await slasher.setSlashableDowntime(23)
      const res = await slasher.slashableDowntime()
      assert.equal(res.toNumber(), 23)
    })
    it('should emit the corresponding event', async () => {
      const resp = await slasher.setSlashableDowntime(23)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'SlashableDowntimeSet',
        args: {
          interval: new BigNumber(23),
        },
      })
    })
  })

  describe('#slash()', () => {
    let blockNumber: number
    let startBlock: number
    const validatorIndex = 0
    beforeEach(async () => {
      blockNumber = await web3.eth.getBlockNumber()
      startBlock = blockNumber - 20
      const epoch = Math.floor(blockNumber / EPOCH)
      await slasher.setEpochSigner(epoch, validatorIndex, validator)
      await slasher.setEpochSigner(epoch - 1, validatorIndex, validator)
      await slasher.setEpochSigner(epoch + 1, validatorIndex, validator)
      // Signed by validators 0 and 1
      const bitmap = '0x0000000000000000000000000000000000000000000000000000000000000003'
      // Signed by validator 1
      const bitmap2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
      await slasher.setParentSealBitmap(blockNumber, bitmap)
      await slasher.setParentSealBitmap(blockNumber + 1, bitmap)
      await slasher.setParentSealBitmap(blockNumber + 2, bitmap2)
      await slasher.setNumberValidators(2)
    })
    it('fails if epoch signer is wrong', async () => {
      await assertRevert(
        slasher.slash(
          accounts[4],
          startBlock,
          validatorIndex,
          validatorIndex,
          0,
          [],
          [],
          [],
          [],
          [],
          []
        )
      )
    })
    it('fails if they were signed', async () => {
      await assertRevert(
        slasher.slash(
          validator,
          blockNumber,
          validatorIndex,
          validatorIndex,
          0,
          [],
          [],
          [],
          [],
          [],
          []
        )
      )
    })
    it('decrements gold when success', async () => {
      await slasher.slash(
        validator,
        startBlock,
        validatorIndex,
        validatorIndex,
        0,
        [],
        [],
        [],
        [],
        [],
        []
      )
      const balance = await mockLockedGold.nonvotingAccountBalance(validator)
      assert.equal(balance.toNumber(), 40000)
    })
    it('cannot be slashed twice', async () => {
      await slasher.slash(
        validator,
        startBlock + 1,
        validatorIndex,
        validatorIndex,
        0,
        [],
        [],
        [],
        [],
        [],
        []
      )
      await assertRevert(
        slasher.slash(
          validator,
          startBlock,
          validatorIndex,
          validatorIndex,
          0,
          [],
          [],
          [],
          [],
          [],
          []
        )
      )
    })
  })
})
