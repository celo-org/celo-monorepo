import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert } from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import * as _ from 'lodash'
import {
  AccountsContract,
  AccountsInstance,
  GoldTokenContract,
  GoldTokenInstance,
  LockedGoldContract,
  LockedGoldInstance,
  RegistryContract,
  RegistryInstance,
  VestingFactoryContract,
  VestingFactoryInstance,
} from 'types'

const ONE_GOLDTOKEN = new BigNumber('1000000000000000000')

const VestingFactory: VestingFactoryContract = artifacts.require('VestingFactory')
const Accounts: AccountsContract = artifacts.require('Accounts')
const LockedGold: LockedGoldContract = artifacts.require('LockedGold')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'

const MINUTE = 60
const HOUR = 60 * 60
const DAY = 24 * HOUR
const MONTH = 30 * DAY

contract('Vesting', (accounts: string[]) => {
  const owner = accounts[0]
  const beneficiary = accounts[1]
  const revoker = accounts[2]
  const refundDestination = accounts[3]
  let accountsInstance: AccountsInstance
  let lockedGoldInstance: LockedGoldInstance
  let goldTokenInstance: GoldTokenInstance
  let vestingFactoryInstance: VestingFactoryInstance
  let registry: RegistryInstance

  const vestingDefaultSchedule = {
    vestingBeneficiary: beneficiary,
    vestingAmount: ONE_GOLDTOKEN,
    vestingCliff: HOUR,
    vestingStartTime: Math.round((Date.now() + 5 * MINUTE * 1000) / 1000),
    vestingPeriodSec: MONTH * 3,
    vestAmountPerPeriod: ONE_GOLDTOKEN.div(4),
    vestingRevokable: true,
    vestingRevoker: revoker,
    vestingRefundDestination: refundDestination,
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    lockedGoldInstance = await LockedGold.new()
    goldTokenInstance = await GoldToken.new()
    vestingFactoryInstance = await VestingFactory.new()

    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, lockedGoldInstance.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldTokenInstance.address)
    await registry.setAddressFor(CeloContractName.VestingFactory, vestingFactoryInstance.address)
    await vestingFactoryInstance.initialize(registry.address)
    await accountsInstance.createAccount()

    // prefund the vesting factory instance to simulate well-funded core contract in the genesis block
    await goldTokenInstance.transfer(vestingFactoryInstance.address, ONE_GOLDTOKEN.times(2), {
      from: owner,
    })
  })

  describe('#initialize()', () => {
    it('should set the owner', async () => {
      const vestingFactoryOwner: string = await vestingFactoryInstance.owner()
      assert.equal(vestingFactoryOwner, owner)
    })

    it('should set the registry address', async () => {
      const registryAddress: string = await vestingFactoryInstance.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should revert if already initialized', async () => {
      await assertRevert(vestingFactoryInstance.initialize(registry.address))
    })
  })

  describe('#setRegistry()', () => {
    const anAddress: string = accounts[2]

    it('should set the registry when called by the owner', async () => {
      await vestingFactoryInstance.setRegistry(anAddress)
      assert.equal(await vestingFactoryInstance.registry(), anAddress)
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(vestingFactoryInstance.setRegistry(anAddress, { from: beneficiary }))
    })
  })

  describe('#vesting creation()', () => {
    it('should create a new vesting instance', async () => {
      const vestingInstanceCreation = await vestingFactoryInstance.createVestingInstance(
        ...Object.keys(vestingDefaultSchedule).map((k) => vestingDefaultSchedule[k])
      )

      const newVestingInstanceCreatedEvent = _.find(vestingInstanceCreation.logs, {
        event: 'NewVestingInstanceCreated',
      })
      assert.exists(newVestingInstanceCreatedEvent)
      const vestingRegistry = await vestingFactoryInstance.hasVestedAt(beneficiary)
      assert.equal(newVestingInstanceCreatedEvent.args.atAddress, vestingRegistry)
    })
  })
})
