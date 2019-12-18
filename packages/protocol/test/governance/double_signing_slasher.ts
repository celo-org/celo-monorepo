import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertContainSubset, assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  MockElectionContract,
  MockElectionInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
  TestDoubleSigningSlasherContract,
  TestDoubleSigningSlasherInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const DoubleSigningSlasher: TestDoubleSigningSlasherContract = artifacts.require(
  'TestDoubleSigningSlasher'
)
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

const EPOCH = 100

// @ts-ignore
// TODO(mcortesi): Use BN
DoubleSigningSlasher.numberFormat = 'BigNumber'

contract('DoubleSigningSlasher', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDoubleSigningSlasherInstance

  const nonOwner = accounts[1]
  const validator = accounts[1]

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockElection = await MockElection.new()
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await MockValidators.new()
    slasher = await DoubleSigningSlasher.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await registry.setAddressFor(CeloContractName.DoubleSigningSlasher, slasher.address)
    await registry.setAddressFor(CeloContractName.DowntimeSlasher, accounts[5])
    await registry.setAddressFor(CeloContractName.GovernanceSlasher, accounts[6])
    await registry.setAddressFor(CeloContractName.Governance, accounts[7])
    const group = accounts[0]
    await validators.affiliate(group, { from: validator })
    await validators.affiliate(accounts[3], { from: accounts[4] })
    await slasher.initialize(registry.address, 10000, 100)
    await mockLockedGold.incrementNonvotingAccountBalance(validator, 50000)
    await mockLockedGold.incrementNonvotingAccountBalance(group, 50000)
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
    it('can only be called once', async () => {
      await assertRevert(slasher.initialize(registry.address, 10000, 100))
    })
  })

  describe('#setSlashingIncentives()', () => {
    it('can only be set by the owner', async () => {
      await assertRevert(slasher.setSlashingIncentives(123, 67, { from: nonOwner }))
    })
    it('reward cannot be larger than penalty', async () => {
      await assertRevert(slasher.setSlashingIncentives(123, 678))
    })
    it('should have set slashing incentives', async () => {
      await slasher.setSlashingIncentives(123, 67)
      const res = await slasher.slashingIncentives()
      assert.equal(res[0].toNumber(), 123)
      assert.equal(res[1].toNumber(), 67)
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

  describe('#slash()', () => {
    const blockNumber = 100
    const validatorIndex = 5
    const blockA = ['0x12', '0x12', '0x12']
    const blockB = ['0x13', '0x13', '0x13']
    const blockC = ['0x11', '0x13', '0x14']
    beforeEach(async () => {
      await slasher.setBlockNumber(blockA, blockNumber)
      await slasher.setBlockNumber(blockB, blockNumber + 1)
      await slasher.setBlockNumber(blockC, blockNumber)
      await slasher.setEpochSigner(Math.floor(blockNumber / EPOCH), validatorIndex, validator)
      await slasher.setEpochSigner(Math.floor(blockNumber / EPOCH), validatorIndex + 1, validator)
      // Signed by validators 0 to 5
      const bitmap = '0x000000000000000000000000000000000000000000000000000000000000003f'
      await slasher.setNumberValidators(7)
      await slasher.setVerifiedSealBitmap(blockA, bitmap)
      await slasher.setVerifiedSealBitmap(blockB, bitmap)
      await slasher.setVerifiedSealBitmap(blockC, bitmap)
    })
    it('fails if block numbers do not match', async () => {
      await assertRevert(
        slasher.slash(validator, validatorIndex, blockA, blockB, 0, [], [], [], [], [], [])
      )
    })
    it('fails if is not signed at index', async () => {
      await assertRevert(
        slasher.slash(validator, validatorIndex + 1, blockA, blockC, 0, [], [], [], [], [], [])
      )
    })
    it('fails if epoch signer is wrong', async () => {
      await assertRevert(
        slasher.slash(accounts[4], validatorIndex, blockA, blockC, 0, [], [], [], [], [], [])
      )
    })
    it('fails if there are not enough signers', async () => {
      await slasher.setNumberValidators(100)
      await assertRevert(
        slasher.slash(validator, validatorIndex, blockA, blockC, 0, [], [], [], [], [], [])
      )
    })
    it('decrements gold when success', async () => {
      await slasher.slash(validator, validatorIndex, blockA, blockC, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.nonvotingAccountBalance(validator)
      assert.equal(balance.toNumber(), 40000)
    })
    it('fails when tried second time', async () => {
      await slasher.slash(validator, validatorIndex, blockA, blockC, 0, [], [], [], [], [], [])
      await assertRevert(
        slasher.slash(validator, validatorIndex, blockA, blockC, 0, [], [], [], [], [], [])
      )
    })
  })
})
