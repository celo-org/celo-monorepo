import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import * as _ from 'lodash'
import { upperFirst } from 'lodash'
import {
  AccountsContract,
  AccountsInstance,
  GoldTokenContract,
  GoldTokenInstance,
  LockedGoldContract,
  LockedGoldInstance,
  MockElectionContract,
  MockElectionInstance,
  MockGovernanceContract,
  MockGovernanceInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
  VestingFactoryContract,
  VestingFactoryInstance,
  VestingInstanceContract,
} from 'types'
import Web3 = require('web3')

const ONE_GOLDTOKEN = new BigNumber('1000000000000000000')

const authorizationTests: any = {}
const authorizationTestDescriptions = {
  voting: {
    me: 'vote signing key',
    subject: 'voteSigner',
  },
  validating: {
    me: 'validator signing key',
    subject: 'validatorSigner',
  },
  attesting: {
    me: 'attestation signing key',
    subject: 'attestationSigner',
  },
}

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
const MockGovernance: MockGovernanceContract = artifacts.require('MockGovernance')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'

const MINUTE = 60
const HOUR = 60 * 60
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const UNLOCKING_PERIOD = 3 * DAY

contract('Vesting', (accounts: string[]) => {
  const owner = accounts[0]
  const beneficiary = accounts[1]
  const revoker = accounts[2]
  const refundDestination = accounts[3]
  let accountsInstance: AccountsInstance
  let lockedGoldInstance: LockedGoldInstance
  let goldTokenInstance: GoldTokenInstance
  let vestingFactoryInstance: VestingFactoryInstance
  let mockElection: MockElectionInstance
  let mockGovernance: MockGovernanceInstance
  let mockValidators: MockValidatorsInstance
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
    mockElection = await MockElection.new()
    mockValidators = await MockValidators.new()
    mockGovernance = await MockGovernance.new()

    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, lockedGoldInstance.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldTokenInstance.address)
    await registry.setAddressFor(CeloContractName.VestingFactory, vestingFactoryInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.Governance, mockGovernance.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await lockedGoldInstance.initialize(registry.address, UNLOCKING_PERIOD)
    await vestingFactoryInstance.initialize(registry.address)
    await accountsInstance.initialize(registry.address)
    await accountsInstance.createAccount({ from: beneficiary })

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
      const currentlyWithdrawn = await vestingInstance.currentlyWithdrawn()
      assert.isTrue(new BigNumber(currentlyWithdrawn).gt(0))
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

  describe('#vesting - withdrawal at timestamp()', () => {
    it('beneficiary should not be able to withdraw a quarter of the vested amount after 3 months under current test constellation', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      await vestingInstance.withdraw({ from: beneficiary })
      const currentlyWithdrawn = await vestingInstance.currentlyWithdrawn()
      assert.isTrue(
        new BigNumber(currentlyWithdrawn).gte(vestingDefaultSchedule.vestingAmount.div(4))
      )
    })

    it('beneficiary should be able to withdraw half the vested amount after 6 months under current test constellation', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const timeToTravel = 6 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      await vestingInstance.withdraw({ from: beneficiary })
      const currentlyWithdrawn = await vestingInstance.currentlyWithdrawn()
      assert.isTrue(
        new BigNumber(currentlyWithdrawn).gte(vestingDefaultSchedule.vestingAmount.div(2))
      )
    })

    it('beneficiary should be able to withdraw at a timestamp and have 0 withdrawable limit straight after', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      // IMPORTANT: here some time must be passed as to avoid small numbers in solidity (e.g < 1*10**18)
      const timeToTravel = 3 * MONTH
      await timeTravel(timeToTravel, web3)
      await vestingInstance.withdraw({ from: beneficiary })
      const currentTimestamp = await getCurrentBlockchainTimestamp(web3)
      const currentlyWithdrawable = await vestingInstance.getWithdrawableAmountAtTimestamp(
        currentTimestamp
      )
      assertEqualBN(currentlyWithdrawable, 0)
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

  describe('#vesting - revoke()', () => {
    it('revoker should be able to revoke the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const revokeVestingTx = await vestingInstance.revoke(
        await getCurrentBlockchainTimestamp(web3),
        { from: revoker }
      )
      const isVestingRevoked = await vestingInstance.revoked()
      assert.isTrue(isVestingRevoked)
      const vestingRevokedEvent = _.find(revokeVestingTx.logs, {
        event: 'VestingRevoked',
      })
      assert.exists(vestingRevokedEvent)
    })

    it('revoker should be able to revoke the vesting even if revoked date is in the past', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const revokeVestingTx = await vestingInstance.revoke(
        (await getCurrentBlockchainTimestamp(web3)) - 2 * DAY,
        { from: revoker }
      )
      const isVestingRevoked = await vestingInstance.revoked()
      assert.isTrue(isVestingRevoked)
      const vestingRevokedEvent = _.find(revokeVestingTx.logs, {
        event: 'VestingRevoked',
      })
      assert.exists(vestingRevokedEvent)
    })

    it('should revert if vesting is already revoked', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await vestingInstance.revoke((await getCurrentBlockchainTimestamp(web3)) - 2 * DAY, {
        from: revoker,
      })
      await assertRevert(
        vestingInstance.revoke(await getCurrentBlockchainTimestamp(web3), { from: revoker })
      )
    })

    it('should revert if vesting is none-revokable', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingRevokable = false
      await createNewVestingInstanceTx(vestingSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await assertRevert(
        vestingInstance.revoke(await getCurrentBlockchainTimestamp(web3), { from: revoker })
      )
    })

    it('refundDestination should obtain remaining unwithdrawn amount when revoked', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      const timeToTravel = 6 * MONTH
      await timeTravel(timeToTravel, web3)
      // let the beneficiary withdraw
      await vestingInstance.withdraw({ from: beneficiary })
      const currentlyWithdrawnByBeneficiary = await vestingInstance.currentlyWithdrawn()
      const refundAddressBalanceBefore = await goldTokenInstance.balanceOf(refundDestination)
      // let the revoker revoke right after the withdraw
      await vestingInstance.revoke(await getCurrentBlockchainTimestamp(web3), { from: revoker })
      const refundAddressBalanceAfter = await goldTokenInstance.balanceOf(refundDestination)
      const expectedRefundDestinationTransfer = vestingDefaultSchedule.vestingAmount.minus(
        new BigNumber(currentlyWithdrawnByBeneficiary.toString())
      )
      const refundAddressBalanceDiff = new BigNumber(refundAddressBalanceAfter).minus(
        new BigNumber(refundAddressBalanceBefore)
      )
      assertEqualBN(refundAddressBalanceDiff, expectedRefundDestinationTransfer)
    })
  })

  describe('#locking - lock()', () => {
    it('beneficiary should lock up to the vested amount', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      // beneficiary shall make the vested instance an account
      await vestingInstance.createAccount({ from: beneficiary })
      // lock the entire vesting amount
      await vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })
      assertEqualBN(
        await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address),
        vestingDefaultSchedule.vestingAmount
      )
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
        vestingDefaultSchedule.vestingAmount
      )
      assertEqualBN(
        await lockedGoldInstance.getNonvotingLockedGold(),
        vestingDefaultSchedule.vestingAmount
      )
      assertEqualBN(
        await lockedGoldInstance.getTotalLockedGold(),
        vestingDefaultSchedule.vestingAmount
      )
    })

    it('should revert if vesting instance is not an account', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await assertRevert(
        vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
          from: beneficiary,
        })
      )
    })

    it('should revert if beneficiary tries to lock up more than the vested amount', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      // beneficiary shall make the vested instance an account
      await vestingInstance.createAccount({ from: beneficiary })
      await assertRevert(
        vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount.multipliedBy(1.1), {
          from: beneficiary,
        })
      )
    })

    it('should revert if none-beneficiary tries to lock up to the vested amount', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      const vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      // beneficiary shall make the vested instance an account
      await vestingInstance.createAccount({ from: beneficiary })
      await assertRevert(
        vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, { from: accounts[6] })
      )
    })
  })

  describe('#unlocking - unlock()', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      // beneficiary shall make the vested instance an account
      await vestingInstance.createAccount({ from: beneficiary })
    })

    it('beneficiary should unlock his locked gold and add a pending withdrawal', async () => {
      // lock the entire vesting amount
      await vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await vestingInstance.unlockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })

      const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
        vestingInstance.address
      )
      assert.equal(values.length, 1)
      assert.equal(timestamps.length, 1)
      assertEqualBN(values[0], vestingDefaultSchedule.vestingAmount)
      assertEqualBN(timestamps[0], (await getCurrentBlockchainTimestamp(web3)) + UNLOCKING_PERIOD)

      assertEqualBN(await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address), 0)
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
        0
      )
      assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), 0)
      assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), 0)
    })

    it('beneficiary should unlock his locked gold and add a pending withdrawal', async () => {
      // lock the entire vesting amount
      await vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await vestingInstance.unlockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })

      const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
        vestingInstance.address
      )
      assert.equal(values.length, 1)
      assert.equal(timestamps.length, 1)
      assertEqualBN(values[0], vestingDefaultSchedule.vestingAmount)
      assertEqualBN(timestamps[0], (await getCurrentBlockchainTimestamp(web3)) + UNLOCKING_PERIOD)

      assertEqualBN(await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address), 0)
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
        0
      )
      assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), 0)
      assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), 0)
    })

    it('should revert if none-beneficiary tries to unlock the locked amount', async () => {
      // lock the entire vesting amount
      await vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertRevert(
        vestingInstance.unlockGold(vestingDefaultSchedule.vestingAmount, { from: accounts[5] })
      )
    })

    it('should revert if beneficiary in voting tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(vestingInstance.address)
      // lock the entire vesting amount
      await vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertRevert(
        vestingInstance.unlockGold(vestingDefaultSchedule.vestingAmount, { from: accounts[5] })
      )
    })

    it('should revert if beneficiary with balance requirements tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(vestingInstance.address)
      // lock the entire vesting amount
      await vestingInstance.lockGold(vestingDefaultSchedule.vestingAmount, {
        from: beneficiary,
      })
      // set some balance requirements
      const balanceRequirement = 10
      await mockValidators.setAccountLockedGoldRequirement(
        vestingInstance.address,
        balanceRequirement
      )
      // unlock the latter
      await assertRevert(
        vestingInstance.unlockGold(vestingDefaultSchedule.vestingAmount, { from: beneficiary })
      )
    })
  })

  describe('#withdrawLockedGold()', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance
    const value = 1000
    const index = 0

    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
        vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
        vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
        await vestingInstance.createAccount({ from: beneficiary })
        await vestingInstance.lockGold(value, { from: beneficiary })
        await vestingInstance.unlockGold(value, { from: beneficiary })
      })

      describe('when it is after the availablity time', () => {
        beforeEach(async () => {
          await timeTravel(UNLOCKING_PERIOD, web3)
          await vestingInstance.withdrawLockedGold(index, { from: beneficiary })
        })

        it('should remove the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
            vestingInstance.address
          )
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
        })
      })

      describe('when it is before the availablity time', () => {
        it('should revert', async () => {
          await assertRevert(vestingInstance.withdrawLockedGold(index, { from: beneficiary }))
        })
      })

      describe('when none-beneficiary attempts to withdraw the gold', () => {
        it('should revert', async () => {
          await assertRevert(vestingInstance.withdrawLockedGold(index, { from: accounts[4] }))
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(vestingInstance.withdrawLockedGold(index, { from: beneficiary }))
      })
    })
  })

  describe('#createAccount', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
    })

    it('creates the account by beneficiary', async () => {
      let isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isFalse(isAccount)
      await vestingInstance.createAccount({ from: beneficiary })
      isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isTrue(isAccount)
    })

    it('reverts if a none-beneficiary attempts account creation', async () => {
      const isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isFalse(isAccount)
      await assertRevert(vestingInstance.createAccount({ from: accounts[2] }))
    })
  })

  describe('#setAccount', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance
    const accountName = 'name'
    const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const walletAddress = beneficiary

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
    })

    it('sets the account by beneficiary', async () => {
      let isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isFalse(isAccount)
      await vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
        from: beneficiary,
      })
      isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isTrue(isAccount)
    })

    it('reverts if a none-beneficiary attempts to set the account', async () => {
      const isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isFalse(isAccount)
      await assertRevert(
        vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: accounts[2],
        })
      )
    })

    it('should set the name, dataEncryptionKey and walletAddress by beneficiary', async () => {
      let isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isFalse(isAccount)
      await vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
        from: beneficiary,
      })
      isAccount = await accountsInstance.isAccount(vestingInstance.address)
      assert.isTrue(isAccount)
      const expectedWalletAddress = await accountsInstance.getWalletAddress(vestingInstance.address)
      assert.equal(expectedWalletAddress, walletAddress)
      // @ts-ignore
      const expectedKey: string = await accountsInstance.getDataEncryptionKey(
        vestingInstance.address
      )
      assert.equal(expectedKey, dataEncryptionKey)
      const expectedName = await accountsInstance.getName(vestingInstance.address)
      assert.equal(expectedName, accountName)
    })
  })

  describe('#setAccountName', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance
    const accountName = 'name'

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
    })

    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(vestingInstance.setAccountName(accountName, { from: beneficiary }))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await vestingInstance.createAccount({ from: beneficiary })
      })

      it('beneficiary should set the name', async () => {
        await vestingInstance.setAccountName(accountName, { from: beneficiary })
        const result = await accountsInstance.getName(vestingInstance.address)
        assert.equal(result, accountName)
      })

      it('should revert if none-beneficiary attempts to set the name', async () => {
        await assertRevert(vestingInstance.setAccountName(accountName, { from: accounts[2] }))
      })
    })
  })

  describe('#setAccountWalletAddress', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance
    const walletAddress = beneficiary

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
    })

    describe('when the vesting account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(
          vestingInstance.setAccountWalletAddress(walletAddress, { from: beneficiary })
        )
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await vestingInstance.createAccount({ from: beneficiary })
      })

      it('beneficiary should set the walletAddress', async () => {
        await vestingInstance.setAccountWalletAddress(walletAddress, { from: beneficiary })
        const result = await accountsInstance.getWalletAddress(vestingInstance.address)
        assert.equal(result, walletAddress)
      })

      it('should revert if none-beneficiary attempts to set the walletAddress', async () => {
        await assertRevert(
          vestingInstance.setAccountWalletAddress(walletAddress, { from: accounts[2] })
        )
      })

      it('should set the NULL_ADDRESS', async () => {
        await vestingInstance.setAccountWalletAddress(NULL_ADDRESS, { from: beneficiary })
        const result = await accountsInstance.getWalletAddress(vestingInstance.address)
        assert.equal(result, NULL_ADDRESS)
      })
    })
  })

  describe('#setAccountMetadataURL', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance
    const metadataURL = 'meta'

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
    })

    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(
          vestingInstance.setAccountMetadataURL(metadataURL, { from: beneficiary })
        )
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await vestingInstance.createAccount({ from: beneficiary })
      })

      it('beneficiary should set the metadataURL', async () => {
        await vestingInstance.setAccountMetadataURL(metadataURL, { from: beneficiary })
        const result = await accountsInstance.getMetadataURL(vestingInstance.address)
        assert.equal(result, metadataURL)
      })

      it('should revert if none-beneficiary attempts to set the metadataURL', async () => {
        await assertRevert(
          vestingInstance.setAccountMetadataURL(metadataURL, { from: accounts[2] })
        )
      })
    })
  })

  describe('#setAccountDataEncryptionKey()', () => {
    let vestingInstanceRegistryAddress
    let vestingInstance
    const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const longDataEncryptionKey =
      '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
      '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
      vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
      await vestingInstance.createAccount({ from: beneficiary })
    })

    it('beneficiary should set dataEncryptionKey', async () => {
      // @ts-ignore
      await vestingInstance.setAccountDataEncryptionKey(dataEncryptionKey, { from: beneficiary })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        vestingInstance.address
      )
      assert.equal(fetchedKey, dataEncryptionKey)
    })

    it('should revert if none-beneficiary attempts to set dataEncryptionKey', async () => {
      // @ts-ignore
      await assertRevert(
        vestingInstance.setAccountDataEncryptionKey(dataEncryptionKey, { from: accounts[2] })
      )
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros = '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      // @ts-ignore
      await vestingInstance.setAccountDataEncryptionKey(keyWithZeros, { from: beneficiary })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        vestingInstance.address
      )
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      // @ts-ignore
      await assertRevert(
        vestingInstance.setAccountDataEncryptionKey('0x32132931293', { from: beneficiary })
      )
    })

    it('should allow a key that is longer than 33 bytes', async () => {
      // @ts-ignore
      await vestingInstance.setAccountDataEncryptionKey(longDataEncryptionKey, {
        from: beneficiary,
      })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        vestingInstance.address
      )
      assert.equal(fetchedKey, longDataEncryptionKey)
    })
  })

  Object.keys(authorizationTestDescriptions).forEach((key) => {
    describe('authorization tests:', () => {
      let authorizationTest: any
      let vestingInstanceRegistryAddress: any
      let vestingInstance: any

      beforeEach(async () => {
        await createNewVestingInstanceTx(vestingDefaultSchedule, registry.address, web3)
        vestingInstanceRegistryAddress = await vestingFactoryInstance.hasVestedAt(beneficiary)
        vestingInstance = await VestingInstance.at(vestingInstanceRegistryAddress)
        await vestingInstance.createAccount({ from: beneficiary })

        authorizationTests.voting = {
          fn: vestingInstance.authorizeVoteSigner,
          eventName: 'VoteSignerAuthorized',
          getAuthorizedFromAccount: accountsInstance.getVoteSigner,
          authorizedSignerToAccount: accountsInstance.voteSignerToAccount,
        }
        authorizationTests.validating = {
          fn: vestingInstance.authorizeValidatorSigner,
          eventName: 'ValidatorSignerAuthorized',
          getAuthorizedFromAccount: accountsInstance.getValidatorSigner,
          authorizedSignerToAccount: accountsInstance.validatorSignerToAccount,
        }
        authorizationTests.attesting = {
          fn: vestingInstance.authorizeAttestationSigner,
          eventName: 'AttestationSignerAuthorized',
          getAuthorizedFromAccount: accountsInstance.getAttestationSigner,
          authorizedSignerToAccount: accountsInstance.attestationSignerToAccount,
        }

        authorizationTest = authorizationTests[key]
      })

      describe(`#authorize${upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
        const authorized = accounts[4] // the account that is to be authorized for whatever role
        let sig: any

        beforeEach(async () => {
          sig = await getParsedSignatureOfAddress(web3, vestingInstance.address, authorized)
        })

        it(`should set the authorized ${authorizationTestDescriptions[key].me}`, async () => {
          await authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
          assert.equal(await accountsInstance.authorizedBy(authorized), vestingInstance.address)
          assert.equal(
            await authorizationTest.getAuthorizedFromAccount(vestingInstance.address),
            authorized
          )
          assert.equal(
            await authorizationTest.authorizedSignerToAccount(authorized),
            vestingInstance.address
          )
        })

        it(`should revert if the ${
          authorizationTestDescriptions[key].me
        } is an account`, async () => {
          await accountsInstance.createAccount({ from: authorized })
          await assertRevert(
            authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
          )
        })

        it(`should revert if the ${
          authorizationTestDescriptions[key].me
        } is already authorized`, async () => {
          const otherAccount = accounts[5]
          const otherSig = await getParsedSignatureOfAddress(
            web3,
            vestingInstance.address,
            otherAccount
          )
          await accountsInstance.createAccount({ from: otherAccount })
          await assertRevert(
            authorizationTest.fn(otherAccount, otherSig.v, otherSig.r, otherSig.s, {
              from: beneficiary,
            })
          )
        })

        it('should revert if the signature is incorrect', async () => {
          const nonVoter = accounts[5]
          const incorrectSig = await getParsedSignatureOfAddress(
            web3,
            vestingInstance.address,
            nonVoter
          )
          await assertRevert(
            authorizationTest.fn(authorized, incorrectSig.v, incorrectSig.r, incorrectSig.s, {
              from: beneficiary,
            })
          )
        })

        describe('when a previous authorization has been made', () => {
          const newAuthorized = accounts[6]
          let newSig
          beforeEach(async () => {
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
            newSig = await getParsedSignatureOfAddress(web3, vestingInstance.address, newAuthorized)
            await authorizationTest.fn(newAuthorized, newSig.v, newSig.r, newSig.s, {
              from: beneficiary,
            })
          })

          it(`should set the new authorized ${authorizationTestDescriptions[key].me}`, async () => {
            assert.equal(
              await accountsInstance.authorizedBy(newAuthorized),
              vestingInstance.address
            )
            assert.equal(
              await authorizationTest.getAuthorizedFromAccount(vestingInstance.address),
              newAuthorized
            )
            assert.equal(
              await authorizationTest.authorizedSignerToAccount(newAuthorized),
              vestingInstance.address
            )
          })

          it('should preserve the previous authorization', async () => {
            assert.equal(await accountsInstance.authorizedBy(authorized), vestingInstance.address)
          })
        })
      })
    })
  })
})
