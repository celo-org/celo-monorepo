import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertContainSubset, assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
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
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
DoubleSigningSlasher.numberFormat = 'BigNumber'

contract('DoubleSigningSlasher', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDoubleSigningSlasherInstance

  const nonOwner = accounts[1]
  const validator = accounts[1]
  const group = accounts[0]

  const slashingPenalty = 10000
  const slashingReward = 100

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await MockValidators.new()
    slasher = await DoubleSigningSlasher.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await validators.affiliate(group, { from: validator })
    await validators.affiliate(accounts[3], { from: accounts[4] })
    await slasher.initialize(registry.address, slashingPenalty, slashingReward)
    await Promise.all(
      accounts.map((account) => mockLockedGold.setAccountTotalLockedGold(account, 50000))
    )
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
    const blockNumber = 110
    const validatorIndex = 5
    const headerA = '0x121212'
    const headerB = '0x131313'
    const headerC = '0x111314'
    beforeEach(async () => {
      await slasher.setBlockNumber(headerA, blockNumber)
      await slasher.setBlockNumber(headerB, blockNumber + 1)
      await slasher.setBlockNumber(headerC, blockNumber)
      const epoch = (await slasher.getEpochNumberOfBlock(blockNumber)).toNumber()
      await slasher.setEpochSigner(epoch, validatorIndex, validator)
      await slasher.setEpochSigner(epoch, validatorIndex + 1, accounts[4])
      // Signed by validators 0 to 5
      const bitmap = '0x000000000000000000000000000000000000000000000000000000000000003f'
      await slasher.setNumberValidators(7)
      await slasher.setVerifiedSealBitmap(headerA, bitmap)
      await slasher.setVerifiedSealBitmap(headerB, bitmap)
      await slasher.setVerifiedSealBitmap(headerC, bitmap)
    })
    it('fails if block numbers do not match', async () => {
      await assertRevert(
        slasher.slash(validator, validatorIndex, headerA, headerB, 0, [], [], [], [], [], [])
      )
    })
    it('fails if is not signed at index', async () => {
      await assertRevert(
        slasher.slash(accounts[4], validatorIndex + 1, headerA, headerC, 0, [], [], [], [], [], [])
      )
    })
    it('fails if epoch signer is wrong', async () => {
      await assertRevert(
        slasher.slash(accounts[4], validatorIndex, headerA, headerC, 0, [], [], [], [], [], [])
      )
    })
    it('fails if there are not enough signers', async () => {
      await slasher.setNumberValidators(100)
      await assertRevert(
        slasher.slash(validator, validatorIndex, headerA, headerC, 0, [], [], [], [], [], [])
      )
    })
    it('should emit the corresponding event', async () => {
      const resp = await slasher.slash(
        validator,
        validatorIndex,
        headerA,
        headerC,
        0,
        [],
        [],
        [],
        [],
        [],
        []
      )
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'DoubleSigningSlashPerformed',
        args: {
          validator,
          blockNumber: new BigNumber(blockNumber),
        },
      })
    })
    it('decrements gold when success', async () => {
      await slasher.slash(validator, validatorIndex, headerA, headerC, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.accountTotalLockedGold(validator)
      assert.equal(balance.toNumber(), 40000)
    })
    it('also slashes group', async () => {
      await slasher.slash(validator, validatorIndex, headerA, headerC, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.accountTotalLockedGold(group)
      assert.equal(balance.toNumber(), 40000)
    })
    it('fails when tried second time', async () => {
      await slasher.slash(validator, validatorIndex, headerA, headerC, 0, [], [], [], [], [], [])
      await assertRevert(
        slasher.slash(validator, validatorIndex, headerA, headerC, 0, [], [], [], [], [], [])
      )
    })
  })
})
