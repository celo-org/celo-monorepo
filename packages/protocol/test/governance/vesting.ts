import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
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
  VestingInstanceContract,
} from 'types'
import Web3 = require('web3')

const ONE_GOLDTOKEN = new BigNumber('1000000000000000000')

interface IVestingSchedule {
  vestingBeneficiary: string
  vestingAmount: BigNumber
  vestingCliff: number
  vestingStartTime: number
  vestingPeriodSec: number
  vestAmountPerPeriod: BigNumber
  vestingRevokable: boolean
  vestingRevoker: string
  vestingRefundDestination: string
}

const VestingFactory: VestingFactoryContract = artifacts.require('VestingFactory')
const VestingInstance: VestingInstanceContract = artifacts.require('VestingInstance')
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

  const vestingDefaultSchedule: IVestingSchedule = {
    vestingBeneficiary: beneficiary,
    vestingAmount: ONE_GOLDTOKEN,
    vestingCliff: HOUR,
    vestingStartTime: null, // to be adjusted on every next run
    vestingPeriodSec: 3 * MONTH,
    vestAmountPerPeriod: ONE_GOLDTOKEN.div(4),
    vestingRevokable: true,
    vestingRevoker: revoker,
    vestingRefundDestination: refundDestination,
  }

  const createNewVestingInstanceTx = async (
    vestingSchedule: IVestingSchedule,
    registryAddress: any,
    web3: Web3
  ) => {
    vestingSchedule.vestingStartTime = (await getCurrentBlockchainTimestamp(web3)) + 5 * MINUTE
    const vestingInstanceTx = await vestingFactoryInstance.createVestingInstance(
      vestingSchedule.vestingBeneficiary,
      vestingSchedule.vestingAmount,
      vestingSchedule.vestingCliff,
      vestingSchedule.vestingStartTime,
      vestingSchedule.vestingPeriodSec,
      vestingSchedule.vestAmountPerPeriod,
      vestingSchedule.vestingRevokable,
      vestingSchedule.vestingRevoker,
      vestingSchedule.vestingRefundDestination,
      registryAddress
    )
    return vestingInstanceTx
  }

  const getCurrentBlockchainTimestamp = async (web3: Web3) => {
    const currentBlockNumber = await web3.eth.getBlockNumber()
    const currentDateTimeStamp = await web3.eth.getBlock(currentBlockNumber)
    return currentDateTimeStamp.timestamp
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

    // prefund the vesting factory instance with 2 gold tokens to simulate a well-funded core contract in the genesis block
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

  describe('#vesting - creation()', () => {
    it('should create a new vesting instance and emit event', async () => {
      const newVestingInstanceTx = await createNewVestingInstanceTx(
        vestingDefaultSchedule,
        registry.address,
        web3
      )

      const newVestingInstanceCreatedEvent = _.find(newVestingInstanceTx.logs, {
        event: 'NewVestingInstanceCreated',
      })
      assert.exists(newVestingInstanceCreatedEvent)
    })

    it('should create a new vesting instance and map beneficiary to vesting', async () => {
      const newVestingInstanceTx = await createNewVestingInstanceTx(
        vestingDefaultSchedule,
        registry.address,
        web3
      )
      const newVestingInstanceCreatedEvent = _.find(newVestingInstanceTx.logs, {
        event: 'NewVestingInstanceCreated',
      })
      assert.exists(newVestingInstanceCreatedEvent)
      const newVestingInstanceAddress = newVestingInstanceCreatedEvent.args.atAddress
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      assert.equal(newVestingInstanceAddress, vestingInstanceRegistryAddress)
    })

    it('should revert when vesting factory has insufficient balance to create new instance', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingAmount = ONE_GOLDTOKEN.times(3)
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should have associated funds with a schedule upon creation', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const allocatedFunds = await goldTokenInstance.balanceOf(vestingInstance.address)
      assertEqualBN(allocatedFunds, vestingDefaultSchedule.vestingAmount)
    })

    it('should set a beneficiary to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const vestingBeneficiary = await vestingInstance.beneficiary()
      assert.equal(vestingBeneficiary, vestingDefaultSchedule.vestingBeneficiary)
    })

    it('should set vesting amount to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const [
        vestingAmount,
        vestAmountPerPeriod,
        vestingPeriods,
        vestingPeriodSec,
        vestingStartTime,
        vestingCliffStartTime,
      ] = await vestingInstance.vestingScheme()
      assertEqualBN(vestingAmount, vestingDefaultSchedule.vestingAmount)
    })

    it('should set vesting amount per period to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const [
        vestingAmount,
        vestAmountPerPeriod,
        vestingPeriods,
        vestingPeriodSec,
        vestingStartTime,
        vestingCliffStartTime,
      ] = await vestingInstance.vestingScheme()
      assertEqualBN(vestAmountPerPeriod, vestingDefaultSchedule.vestAmountPerPeriod)
    })

    it('should set vesting periods to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const [
        vestingAmount,
        vestAmountPerPeriod,
        vestingPeriods,
        vestingPeriodSec,
        vestingStartTime,
        vestingCliffStartTime,
      ] = await vestingInstance.vestingScheme()
      const vestingPeriodsComputed = vestingDefaultSchedule.vestingAmount.div(
        vestingDefaultSchedule.vestAmountPerPeriod
      )
      assertEqualBN(vestingPeriodsComputed, vestingPeriods)
    })

    it('should set vesting period per sec to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const [
        vestingAmount,
        vestAmountPerPeriod,
        vestingPeriods,
        vestingPeriodSec,
        vestingStartTime,
        vestingCliffStartTime,
      ] = await vestingInstance.vestingScheme()
      assertEqualBN(vestingPeriodSec, vestingDefaultSchedule.vestingPeriodSec)
    })

    it('should set vesting start time to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const [
        vestingAmount,
        vestAmountPerPeriod,
        vestingPeriods,
        vestingPeriodSec,
        vestingStartTime,
        vestingCliffStartTime,
      ] = await vestingInstance.vestingScheme()
      assertEqualBN(vestingStartTime, vestingDefaultSchedule.vestingStartTime)
    })

    it('should set vesting cliff to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const [
        vestingAmount,
        vestAmountPerPeriod,
        vestingPeriods,
        vestingPeriodSec,
        vestingStartTime,
        vestingCliffStartTime,
      ] = await vestingInstance.vestingScheme()
      const vestingCliffStartTimeComputed = new BigNumber(
        vestingDefaultSchedule.vestingStartTime
      ).plus(vestingDefaultSchedule.vestingCliff)
      assertEqualBN(vestingCliffStartTime, vestingCliffStartTimeComputed)
    })

    it('should set revokable flag to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const vestingRevocable = await vestingInstance.revocable()
      assert.equal(vestingRevocable, vestingDefaultSchedule.vestingRevokable)
    })

    it('should set revoker to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const vestingRevoker = await vestingInstance.revoker()
      assert.equal(vestingRevoker, vestingDefaultSchedule.vestingRevoker)
    })

    it('should set refund destination to vesting instance', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const vestingRefundDestination = await vestingInstance.refundDestination()
      assert.equal(vestingRefundDestination, vestingDefaultSchedule.vestingRefundDestination)
    })

    it('should have zero currently withdrawn on init', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const currentlyWithdrawn = await vestingInstance.currentlyWithdrawn()
      assertEqualBN(currentlyWithdrawn, 0)
    })

    it('should be unrevoked on init', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const isRevoked = await vestingInstance.revoked()
      assert.equal(isRevoked, false)
    })

    it('should be unpaused on init', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const isPaused = await vestingInstance.paused()
      assert.equal(isPaused, false)
    })

    it('should revert when registry address is zero', async () => {
      await assertRevert(createNewVestingInstanceTx(vestingDefaultSchedule, NULL_ADDRESS, web3))
    })

    it('should revert when vesting amount is zero', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingAmount = new BigNumber('0')
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should revert when vesting beneficiary is the genesis address', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingBeneficiary = NULL_ADDRESS
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should revert when refund destination is the genesis address', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingRefundDestination = NULL_ADDRESS
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should revert when vesting period per sec is zero', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingPeriodSec = 0
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should revert when vesting cliff is longer than vesting period per sec', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingCliff = 4 * MONTH
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should revert when vesting amount per period is greater than total vesting amout', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestAmountPerPeriod = ONE_GOLDTOKEN.times(2)
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })

    it('should revert when vesting cliff start point lies in the past', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingStartTime = (await getCurrentBlockchainTimestamp(web3)) - 2 * HOUR
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, registry.address, web3))
    })
  })

  describe('#vesting - withdraw()', () => {
    it('beneficiary should not be able to withdraw before start time of vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const timeToTravel = 4 * MINUTE
      await timeTravel(timeToTravel, web3)
      await assertRevert(vestingInstance.withdraw({ from: beneficiary }))
    })

    it('beneficiary should not be able to withdraw after start time of vesting and before cliff start time', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const timeToTravel = 30 * MINUTE
      await timeTravel(timeToTravel, web3)
      await assertRevert(vestingInstance.withdraw({ from: beneficiary }))
    })

    it('beneficiary should be able to withdraw after cliff start time', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      // IMPORTANT: here some time must be passed as to avoid small numbers in solidity (e.g < 1*10**18)
      const timeToTravel = 3 * MONTH
      await timeTravel(timeToTravel, web3)
      await vestingInstance.withdraw({ from: beneficiary })
    })

    it('none-beneficiary should not be able to withdraw after cliff start time nor at any point', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      let timeToTravel = 3 * MONTH
      await timeTravel(timeToTravel, web3)
      await assertRevert(vestingInstance.withdraw({ from: accounts[5] }))
      timeToTravel = 20 * MONTH
      await timeTravel(timeToTravel, web3)
      await assertRevert(vestingInstance.withdraw({ from: accounts[5] }))
    })

    it('beneficiary should not be able to withdraw within the pause period', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await vestingInstance.pause(300 * DAY, { from: revoker })
      const timeToTravel = 3 * MONTH
      await timeTravel(timeToTravel, web3)
      await assertRevert(vestingInstance.withdraw({ from: beneficiary }))
    })

    it('beneficiary should be able to withdraw after the pause period', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await vestingInstance.pause(300 * DAY, { from: revoker })
      const timeToTravel = 301 * DAY
      await timeTravel(timeToTravel, web3)
      await vestingInstance.withdraw({ from: beneficiary })
    })

    it('beneficiary should be able to withdraw the full amount after vesting period is over', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const timeToTravel = 12 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
      const vestingInstanceBalanceBefore = await goldTokenInstance.balanceOf(
        vestingInstance.address
      )
      await vestingInstance.withdraw({ from: beneficiary })
      const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
      const vestingInstanceBalanceAfter = await goldTokenInstance.balanceOf(vestingInstance.address)
      const beneficiaryBalanceDiff = new BigNumber(beneficiaryBalanceAfter).minus(
        new BigNumber(beneficiaryBalanceBefore)
      )
      const vestingInstanceBalanceDiff = new BigNumber(vestingInstanceBalanceBefore).minus(
        new BigNumber(vestingInstanceBalanceAfter)
      )
      assertEqualBN(vestingInstanceBalanceDiff, vestingDefaultSchedule.vestingAmount)
      assertEqualBN(beneficiaryBalanceDiff, vestingDefaultSchedule.vestingAmount)
    })
  })

  describe('#vesting - pause()', () => {
    it('revoker should be able to pause the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const pauseTx = await vestingInstance.pause(300 * DAY, { from: revoker })
      const isPaused = await vestingInstance.paused()
      assert.isTrue(isPaused)
      const vestingPausedEvent = _.find(pauseTx.logs, {
        event: 'WithdrawalPaused',
      })
      assert.exists(vestingPausedEvent)
    })

    it('revoker should not be able to pause the vesting for more than 365 days', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await assertRevert(vestingInstance.pause(366 * DAY, { from: revoker }))
    })

    it('should revert when none-revoker attempts to pause the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await assertRevert(vestingInstance.pause(300 * DAY, { from: accounts[5] }))
    })

    it('should revert when revoker attempts to pause an already paused vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await vestingInstance.pause(300 * DAY, { from: revoker })
      await assertRevert(vestingInstance.pause(301 * DAY, { from: revoker }))
    })

    it('should revert when revoker attempts to pause a none-revokable vesting', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingRevokable = false
      await createNewVestingInstanceTx(vestingSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await assertRevert(vestingInstance.pause(300 * DAY, { from: revoker }))
    })

    it('should revert when revoker attempts to pause an already revoked vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await vestingInstance.revoke((await getCurrentBlockchainTimestamp(web3)) + 1 * MINUTE, {
        from: revoker,
      })
      await assertRevert(vestingInstance.pause(300 * DAY, { from: revoker }))
    })
  })
})
