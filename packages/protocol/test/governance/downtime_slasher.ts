import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertRevert,
  getFirstBlockNumberForEpoch,
  jsonRpc,
} from '@celo/protocol/lib/test-utils'
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
  TestDowntimeSlasherContract,
  TestDowntimeSlasherInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const DowntimeSlasher: TestDowntimeSlasherContract = artifacts.require('TestDowntimeSlasher')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
DowntimeSlasher.numberFormat = 'BigNumber'

contract('DowntimeSlasher', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: TestDowntimeSlasherInstance

  const nonOwner = accounts[1]
  const validator = accounts[1]
  const group = accounts[0]

  const slashingPenalty = 10000
  const slashingReward = 100
  const slashableDowntime = 10

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await MockValidators.new()
    slasher = await DowntimeSlasher.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await validators.affiliate(group, { from: validator })
    await validators.affiliate(accounts[3], { from: accounts[4] })
    await slasher.initialize(registry.address, slashingPenalty, slashingReward, slashableDowntime)
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
    it('should have set slashable downtime', async () => {
      const res = await slasher.slashableDowntime()
      assert.equal(res.toNumber(), slashableDowntime)
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
    let changeBlock: number
    const validatorIndex = 0
    before(async () => {
      let bn: number = 0
      do {
        bn = await web3.eth.getBlockNumber()
        await jsonRpc(web3, 'evm_mine', [])
      } while (bn < 350)
    })
    beforeEach(async () => {
      blockNumber = await web3.eth.getBlockNumber()
      startBlock = blockNumber - 50
      const epoch = (await slasher.getEpochNumberOfBlock(blockNumber)).toNumber()
      await slasher.setEpochSigner(epoch, validatorIndex, validator)
      await slasher.setEpochSigner(epoch - 1, validatorIndex, validator)
      await slasher.setEpochSigner(epoch - 2, 1, validator)
      await slasher.setEpochSigner(epoch + 1, validatorIndex, validator)
      // Signed by validators 0 and 1
      const bitmap = '0x0000000000000000000000000000000000000000000000000000000000000003'
      // Signed by validator 1
      const bitmap2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
      // Signed by validator 0
      const bitmap3 = '0x0000000000000000000000000000000000000000000000000000000000000001'
      await slasher.setParentSealBitmap(blockNumber, bitmap)
      await slasher.setParentSealBitmap(blockNumber + 1, bitmap)
      await slasher.setParentSealBitmap(blockNumber + 2, bitmap2)
      await slasher.setNumberValidators(2)
      // when epoch-2 changes to epoch-1, the validator to be slashed is down, but our signer number changes
      // another validator is up around the epoch change
      changeBlock = getFirstBlockNumberForEpoch(epoch - 1) - 3
      async function prepareBlock(bn) {
        const parentEpoch = (await slasher.getEpochNumberOfBlock(bn - 1)).toNumber()
        await slasher.setParentSealBitmap(bn, parentEpoch === epoch - 2 ? bitmap3 : bitmap2)
      }
      for (let i = 0; i < 7; i++) {
        await prepareBlock(changeBlock + i)
      }
    })
    it('fails if they were signed', async () => {
      await assertRevert(
        slasher.slash(blockNumber, validatorIndex, validatorIndex, 0, [], [], [], [], [], [])
      )
    })
    it('success with validator index change', async () => {
      await slasher.slash(changeBlock, 1, validatorIndex, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.accountTotalLockedGold(validator)
      assert.equal(balance.toNumber(), 40000)
    })
    it('should emit the corresponding event', async () => {
      const resp = await slasher.slash(
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
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'DowntimeSlashPerformed',
        args: {
          validator,
          startBlock: new BigNumber(startBlock),
        },
      })
    })

    it('decrements gold when success', async () => {
      await slasher.slash(startBlock, validatorIndex, validatorIndex, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.accountTotalLockedGold(validator)
      assert.equal(balance.toNumber(), 40000)
    })
    it('also slashes group', async () => {
      await slasher.slash(startBlock, validatorIndex, validatorIndex, 0, [], [], [], [], [], [])
      const balance = await mockLockedGold.accountTotalLockedGold(group)
      assert.equal(balance.toNumber(), 40000)
    })
    it('cannot be slashed twice', async () => {
      await slasher.slash(startBlock, validatorIndex, validatorIndex, 0, [], [], [], [], [], [])
      await assertRevert(
        slasher.slash(startBlock + 1, validatorIndex, validatorIndex, 0, [], [], [], [], [], [])
      )
    })
    it('but can be slashed later on', async () => {
      await slasher.slash(startBlock, validatorIndex, validatorIndex, 0, [], [], [], [], [], [])
      await slasher.slash(
        startBlock + 20,
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
    })
  })
})
