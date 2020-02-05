import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assertLogMatches,
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
}

interface IVestingSchedule {
  vestingBeneficiary: string
  vestingNumPeriods: number
  vestingCliff: number
  vestingStartTime: number
  vestingPeriodSec: number
  vestAmountPerPeriod: BigNumber
  vestingRevocable: boolean
  vestingRevoker: string
  vestingMaxPausePeriod: number
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
const MAX_PAUSE_PERIOD = 365 * DAY

contract('Vesting', (accounts: string[]) => {
  const owner = accounts[0]
  const beneficiary = accounts[1]
  const revoker = accounts[2]
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
    vestingNumPeriods: 4,
    vestingCliff: HOUR,
    vestingStartTime: null, // to be adjusted on every next run
    vestingPeriodSec: 3 * MONTH,
    vestAmountPerPeriod: ONE_GOLDTOKEN.div(4),
    vestingRevocable: true,
    vestingRevoker: revoker,
    vestingMaxPausePeriod: MAX_PAUSE_PERIOD,
  }

  const createNewVestingInstanceTx = async (vestingSchedule: IVestingSchedule, web3: Web3) => {
    vestingSchedule.vestingStartTime = (await getCurrentBlockchainTimestamp(web3)) + 5 * MINUTE
    const vestingInstanceTx = await vestingFactoryInstance.createVestingInstance(
      vestingSchedule.vestingBeneficiary,
      vestingSchedule.vestingNumPeriods,
      vestingSchedule.vestingCliff,
      vestingSchedule.vestingStartTime,
      vestingSchedule.vestingPeriodSec,
      vestingSchedule.vestAmountPerPeriod,
      vestingSchedule.vestingRevocable,
      vestingSchedule.vestingRevoker,
      vestingSchedule.vestingMaxPausePeriod,
      { from: owner }
    )
    return vestingInstanceTx
  }

  const getCurrentBlockchainTimestamp = async (web3: Web3) => {
    return (await web3.eth.getBlock('latest')).timestamp
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

    // prefund the vesting factory instance with 2 gold tokens to simulate a well-funded factory contract in the genesis block
    await goldTokenInstance.transfer(vestingFactoryInstance.address, ONE_GOLDTOKEN.times(2), {
      from: owner,
    })
  })

  describe('#initialize', () => {
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

  describe('#setRegistry', () => {
    const anAddress: string = accounts[2]

    it('should set the registry when called by the owner', async () => {
      await vestingFactoryInstance.setRegistry(anAddress)
      assert.equal(await vestingFactoryInstance.registry(), anAddress)
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(vestingFactoryInstance.setRegistry(anAddress, { from: beneficiary }))
    })
  })

  describe('#payable', () => {
    it('should accept gold transfer by default from anyone', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      await goldTokenInstance.transfer(vestingInstanceAddress, ONE_GOLDTOKEN.times(2), {
        from: accounts[8],
      })
    })
  })

  describe('#creation', () => {
    let newVestingInstanceTx: any
    let vestingInstanceAddress: any
    let vestingInstance: any

    beforeEach(async () => {
      newVestingInstanceTx = await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
    })

    it('should fail if a non-owner attempts to create a vesting instance', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingStartTime = (await getCurrentBlockchainTimestamp(web3)) + 5 * MINUTE
      await assertRevert(
        vestingFactoryInstance.createVestingInstance(
          vestingSchedule.vestingBeneficiary,
          vestingSchedule.vestingNumPeriods,
          vestingSchedule.vestingCliff,
          vestingSchedule.vestingStartTime,
          vestingSchedule.vestingPeriodSec,
          vestingSchedule.vestAmountPerPeriod,
          vestingSchedule.vestingRevocable,
          vestingSchedule.vestingRevoker,
          vestingSchedule.vestingMaxPausePeriod,
          { from: accounts[5] }
        )
      )
    })

    it('should revert if a vesting instance to the beneficiary already exists', async () => {
      await assertRevert(createNewVestingInstanceTx(vestingDefaultSchedule, web3))
    })

    it('should create a new vesting instance and emit a proper event', async () => {
      const newVestingInstanceCreatedEvent = _.find(newVestingInstanceTx.logs, {
        event: 'NewVestingInstanceCreated',
      })
      assert.exists(newVestingInstanceCreatedEvent)
      const newVestingInstanceBeneficiary = newVestingInstanceCreatedEvent.args.beneficiary
      const newVestingInstanceAddress = newVestingInstanceCreatedEvent.args.atAddress
      assertLogMatches(newVestingInstanceCreatedEvent, 'NewVestingInstanceCreated', {
        beneficiary: newVestingInstanceBeneficiary,
        atAddress: newVestingInstanceAddress,
      })
      assert.equal(newVestingInstanceAddress, vestingInstance.address)
    })

    it('should revert when vesting factory has insufficient balance to create new instance', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingNumPeriods = 3
      vestingSchedule.vestAmountPerPeriod = ONE_GOLDTOKEN
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should have associated funds with a schedule upon creation', async () => {
      const allocatedFunds = await goldTokenInstance.balanceOf(vestingInstance.address)
      assertEqualBN(
        allocatedFunds,
        new BigNumber(vestingDefaultSchedule.vestingNumPeriods).multipliedBy(
          vestingDefaultSchedule.vestAmountPerPeriod
        )
      )
    })

    it('should set a beneficiary to vesting instance', async () => {
      const vestingBeneficiary = await vestingInstance.beneficiary()
      assert.equal(vestingBeneficiary, vestingDefaultSchedule.vestingBeneficiary)
    })

    it('should set a revoker to vesting instance', async () => {
      const vestingRevoker = await vestingInstance.revoker()
      assert.equal(vestingRevoker, vestingDefaultSchedule.vestingRevoker)
    })

    it('should set vesting number of periods to vesting instance', async () => {
      const [vestingNumPeriods, , , , ,] = await vestingInstance.vestingSchedule()
      assertEqualBN(vestingNumPeriods, vestingDefaultSchedule.vestingNumPeriods)
    })

    it('should set vesting amount per period to vesting instance', async () => {
      const [, vestAmountPerPeriod, , , ,] = await vestingInstance.vestingSchedule()
      assertEqualBN(vestAmountPerPeriod, vestingDefaultSchedule.vestAmountPerPeriod)
    })

    it('should set vesting period to vesting instance', async () => {
      const [, , vestingPeriodSec, , ,] = await vestingInstance.vestingSchedule()
      assertEqualBN(vestingPeriodSec, vestingDefaultSchedule.vestingPeriodSec)
    })

    it('should set vesting start time to vesting instance', async () => {
      const [, , , vestingStartTime, ,] = await vestingInstance.vestingSchedule()
      assertEqualBN(vestingStartTime, vestingDefaultSchedule.vestingStartTime)
    })

    it('should set vesting cliff to vesting instance', async () => {
      const [, , , , vestingCliffStartTime] = await vestingInstance.vestingSchedule()
      const vestingCliffStartTimeComputed = new BigNumber(
        vestingDefaultSchedule.vestingStartTime
      ).plus(vestingDefaultSchedule.vestingCliff)
      assertEqualBN(vestingCliffStartTime, vestingCliffStartTimeComputed)
    })

    it('should set revocable flag to vesting instance', async () => {
      const vestingRevocable = await vestingInstance.revocable()
      assert.equal(vestingRevocable, vestingDefaultSchedule.vestingRevocable)
    })

    it('should set revoker to vesting instance', async () => {
      const vestingRevoker = await vestingInstance.revoker()
      assert.equal(vestingRevoker, vestingDefaultSchedule.vestingRevoker)
    })

    it('should set vesting Maximum Pause Period to vesting instance', async () => {
      const vestingMaxPausePeriod = await vestingInstance.maxPausePeriod()
      assertEqualBN(vestingMaxPausePeriod, MAX_PAUSE_PERIOD)
    })

    it('should have zero total withdrawn on init', async () => {
      const totalWithdrawn = await vestingInstance.totalWithdrawn()
      assertEqualBN(totalWithdrawn, 0)
    })

    it('should be unrevoked on init and have revoke time equal zero', async () => {
      const isRevoked = await vestingInstance.isRevoked()
      assert.equal(isRevoked, false)
      const revokeTime = await vestingInstance.revokeTime()
      assertEqualBN(revokeTime, 0)
    })

    it('should be unpaused on init and have pause end time equal zero', async () => {
      const isPaused = await vestingInstance.isPaused()
      assert.equal(isPaused, false)
      const pauseEndTime = await vestingInstance.pauseEndTime()
      assertEqualBN(pauseEndTime, 0)
    })

    it('should have vestedBalanceAtRevoke on init equal to zero', async () => {
      const vestedBalanceAtRevoke = await vestingInstance.vestedBalanceAtRevoke()
      assertEqualBN(vestedBalanceAtRevoke, 0)
    })

    it('should revert when vesting beneficiary is the null address', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingBeneficiary = NULL_ADDRESS
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should revert when vesting revoker is the null address', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingRevoker = NULL_ADDRESS
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should revert when vesting periods are zero', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingNumPeriods = 0
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should revert when vest amount per period is zero', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestAmountPerPeriod = new BigNumber('0')
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should revert when vesting Maximum Pause Period is zero', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingMaxPausePeriod = 0
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should overflow for very large combinations of vest periods and amount per time', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingNumPeriods = Number.MAX_SAFE_INTEGER
      vestingSchedule.vestAmountPerPeriod = new BigNumber(2).pow(300)
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should revert when vesting period is zero', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingPeriodSec = 0
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })

    it('should revert when vesting end point lies before current timestamp', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingStartTime = (await getCurrentBlockchainTimestamp(web3)) - 2 * HOUR
      vestingSchedule.vestingNumPeriods = 1
      vestingSchedule.vestingPeriodSec = 1 * HOUR
      await assertRevert(createNewVestingInstanceTx(vestingSchedule, web3))
    })
  })

  describe('#createAccount', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
    })

    describe('when unrevoked', () => {
      it('creates the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await vestingInstance.createAccount({ from: beneficiary })
        isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-beneficiary attempts account creation', async () => {
        const isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(vestingInstance.createAccount({ from: accounts[2] }))
      })
    })

    describe('when revoked', () => {
      beforeEach(async () => {
        await vestingInstance.revoke({ from: revoker })
      })

      it('creates the account by revoker', async () => {
        let isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await vestingInstance.createAccount({ from: revoker })
        isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-revoker attempts account creation', async () => {
        const isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(vestingInstance.createAccount({ from: beneficiary }))
      })
    })
  })

  describe('#setAccount', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const accountName = 'name'
    const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const walletAddress = beneficiary

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
    })

    describe('when unrevoked', () => {
      it('sets the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: beneficiary,
        })
        isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-beneficiary attempts to set the account', async () => {
        const isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: accounts[2],
          })
        )
      })

      it('should set the name, dataEncryptionKey and walletAddress of the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: beneficiary,
        })
        isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isTrue(isAccount)
        const expectedWalletAddress = await accountsInstance.getWalletAddress(
          vestingInstance.address
        )
        assert.equal(expectedWalletAddress, walletAddress)
        // @ts-ignore
        const expectedKey: string = await accountsInstance.getDataEncryptionKey(
          vestingInstance.address
        )
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(vestingInstance.address)
        assert.equal(expectedName, accountName)
      })

      it('should revert to set the name, dataEncryptionKey and walletAddress of the account by a non-beneficiary', async () => {
        const isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: revoker,
          })
        )
      })
    })

    describe('when revoked', () => {
      beforeEach(async () => {
        await vestingInstance.revoke({ from: revoker })
      })

      it('sets the account by revoker', async () => {
        let isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: revoker,
        })
        isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-revoker attempts to set the account', async () => {
        const isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: beneficiary,
          })
        )
      })

      it('should set the name, dataEncryptionKey and walletAddress of the account by revoker', async () => {
        let isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: revoker,
        })
        isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isTrue(isAccount)
        const expectedWalletAddress = await accountsInstance.getWalletAddress(
          vestingInstance.address
        )
        assert.equal(expectedWalletAddress, walletAddress)
        // @ts-ignore
        const expectedKey: string = await accountsInstance.getDataEncryptionKey(
          vestingInstance.address
        )
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(vestingInstance.address)
        assert.equal(expectedName, accountName)
      })

      it('should revert to set the name, dataEncryptionKey and walletAddress of the account by a non-revoker', async () => {
        const isAccount = await accountsInstance.isAccount(vestingInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          vestingInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: beneficiary,
          })
        )
      })
    })
  })

  describe('#setAccountName', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const accountName = 'name'

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
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

      describe('when unrevoked', () => {
        it('beneficiary should set the name', async () => {
          await vestingInstance.setAccountName(accountName, { from: beneficiary })
          const result = await accountsInstance.getName(vestingInstance.address)
          assert.equal(result, accountName)
        })

        it('should revert if non-beneficiary attempts to set the name', async () => {
          await assertRevert(vestingInstance.setAccountName(accountName, { from: accounts[2] }))
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await vestingInstance.revoke({ from: revoker })
        })

        it('revoker should set the name', async () => {
          await vestingInstance.setAccountName(accountName, { from: revoker })
          const result = await accountsInstance.getName(vestingInstance.address)
          assert.equal(result, accountName)
        })

        it('should revert if beneficiary attempts to set the name', async () => {
          await assertRevert(vestingInstance.setAccountName(accountName, { from: beneficiary }))
        })

        it('should revert if non-revoker attempts to set the name', async () => {
          await assertRevert(vestingInstance.setAccountName(accountName, { from: accounts[6] }))
        })
      })
    })
  })

  describe('#setAccountWalletAddress', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const walletAddress = beneficiary

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
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

      describe('when unrevoked', () => {
        it('beneficiary should set the walletAddress', async () => {
          await vestingInstance.setAccountWalletAddress(walletAddress, { from: beneficiary })
          const result = await accountsInstance.getWalletAddress(vestingInstance.address)
          assert.equal(result, walletAddress)
        })

        it('should revert if non-beneficiary attempts to set the walletAddress', async () => {
          await assertRevert(
            vestingInstance.setAccountWalletAddress(walletAddress, { from: accounts[2] })
          )
        })

        it('beneficiary should set the NULL_ADDRESS', async () => {
          await vestingInstance.setAccountWalletAddress(NULL_ADDRESS, { from: beneficiary })
          const result = await accountsInstance.getWalletAddress(vestingInstance.address)
          assert.equal(result, NULL_ADDRESS)
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await vestingInstance.revoke({ from: revoker })
        })

        it('revoker should set the walletAddress', async () => {
          await vestingInstance.setAccountWalletAddress(walletAddress, { from: revoker })
          const result = await accountsInstance.getWalletAddress(vestingInstance.address)
          assert.equal(result, walletAddress)
        })

        it('should revert if beneficiary attempts to set the walletAddress', async () => {
          await assertRevert(
            vestingInstance.setAccountWalletAddress(walletAddress, { from: beneficiary })
          )
        })

        it('should revert if non-revoker attempts to set the walletAddress', async () => {
          await assertRevert(
            vestingInstance.setAccountWalletAddress(walletAddress, { from: accounts[6] })
          )
        })

        it('revoker should set the NULL_ADDRESS', async () => {
          await vestingInstance.setAccountWalletAddress(NULL_ADDRESS, { from: revoker })
          const result = await accountsInstance.getWalletAddress(vestingInstance.address)
          assert.equal(result, NULL_ADDRESS)
        })
      })
    })
  })

  describe('#setAccountMetadataURL', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const metadataURL = 'meta'

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
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

      describe('when unrevoked', () => {
        it('only beneficiary should set the metadataURL', async () => {
          await vestingInstance.setAccountMetadataURL(metadataURL, { from: beneficiary })
          const result = await accountsInstance.getMetadataURL(vestingInstance.address)
          assert.equal(result, metadataURL)
        })

        it('should revert if non-beneficiary attempts to set the metadataURL', async () => {
          await assertRevert(
            vestingInstance.setAccountMetadataURL(metadataURL, { from: accounts[2] })
          )
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await vestingInstance.revoke({ from: revoker })
        })

        it('revoker should to set the metadataURL', async () => {
          await vestingInstance.setAccountMetadataURL(metadataURL, { from: revoker })
          const result = await accountsInstance.getMetadataURL(vestingInstance.address)
          assert.equal(result, metadataURL)
        })

        it('should revert if beneficiary attempts to set the metadataURL', async () => {
          await assertRevert(
            vestingInstance.setAccountMetadataURL(metadataURL, { from: beneficiary })
          )
        })

        it('should revert if non-revoker attempts to set the metadataURL', async () => {
          await assertRevert(
            vestingInstance.setAccountMetadataURL(metadataURL, { from: accounts[6] })
          )
        })
      })
    })
  })

  describe('#setAccountDataEncryptionKey', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const longDataEncryptionKey =
      '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
      '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await vestingInstance.createAccount({ from: beneficiary })
    })

    it('beneficiary should set dataEncryptionKey', async () => {
      await vestingInstance.setAccountDataEncryptionKey(dataEncryptionKey, { from: beneficiary })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        vestingInstance.address
      )
      assert.equal(fetchedKey, dataEncryptionKey)
    })

    it('should revert if non-beneficiary attempts to set dataEncryptionKey', async () => {
      await assertRevert(
        vestingInstance.setAccountDataEncryptionKey(dataEncryptionKey, { from: accounts[2] })
      )
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros = '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      await vestingInstance.setAccountDataEncryptionKey(keyWithZeros, { from: beneficiary })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        vestingInstance.address
      )
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      await assertRevert(
        vestingInstance.setAccountDataEncryptionKey('0x32132931293', { from: beneficiary })
      )
    })

    it('should allow a key that is longer than 33 bytes', async () => {
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
      let vestingInstanceAddress: any
      let vestingInstance: any

      beforeEach(async () => {
        await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
        vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
        vestingInstance = await VestingInstance.at(vestingInstanceAddress)
        await vestingInstance.createAccount({ from: beneficiary })

        authorizationTests.voting = {
          fn: vestingInstance.authorizeVoteSigner,
          eventName: 'VoteSignerAuthorized',
          getAuthorizedFromAccount: accountsInstance.getVoteSigner,
          authorizedSignerToAccount: accountsInstance.voteSignerToAccount,
        }
        authorizationTest = authorizationTests[key]
      })

      describe(`#authorize${_.upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
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

        it(`should revert if the ${authorizationTestDescriptions[key].me} is an account`, async () => {
          await accountsInstance.createAccount({ from: authorized })
          await assertRevert(
            authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
          )
        })

        it(`should revert if the ${authorizationTestDescriptions[key].me} is already authorized`, async () => {
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
          let newSig: any
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

  describe('#pause', () => {
    it('revoker should be able to pause the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      const pauseTx = await vestingInstance.pause(300 * DAY, { from: revoker })
      assert.isTrue(await vestingInstance.isPaused())
      assert.isTrue((await vestingInstance.pauseEndTime()).gt('0'))
      const pausedTxEvent = _.find(pauseTx.logs, {
        event: 'WithdrawalPaused',
      })
      assert.exists(pausedTxEvent)
      assertEqualBN(pausedTxEvent.args.pauseEnd, await vestingInstance.pauseEndTime())
    })

    it('revoker should not be able to pause the vesting for more than max pause period', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await assertRevert(vestingInstance.pause(366 * DAY, { from: revoker }))
    })

    it('should revert when non-revoker attempts to pause the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await assertRevert(vestingInstance.pause(300 * DAY, { from: accounts[5] }))
    })

    it('should revert when revoker attempts to pause an already paused vesting which has not finished', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await vestingInstance.pause(300 * DAY, { from: revoker })
      await assertRevert(vestingInstance.pause(301 * DAY, { from: revoker }))
    })

    // TODO(lucas): this should not be true when pausing is changed.
    it('should revert when revoker attempts to pause a non-revocable vesting', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingRevocable = false
      await createNewVestingInstanceTx(vestingSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await assertRevert(vestingInstance.pause(300 * DAY, { from: revoker }))
    })

    it('should revert when revoker attempts to pause an already revoked vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await vestingInstance.revoke({ from: revoker })
      await assertRevert(vestingInstance.pause(300 * DAY, { from: revoker }))
    })
  })

  describe('#revoke', () => {
    it('revoker should be able to revoke the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      const revokeVestingTx = await vestingInstance.revoke({ from: revoker })
      const revokeBlockTimestamp = await getCurrentBlockchainTimestamp(web3)
      const vestingRevokeTime = await vestingInstance.revokeTime()
      assertEqualBN(revokeBlockTimestamp, vestingRevokeTime)
      assert.isTrue(await vestingInstance.isRevoked())
      assertLogMatches(revokeVestingTx.logs[0], 'VestingRevoked', {
        revokeTimestamp: revokeBlockTimestamp,
        vestedBalanceAtRevoke: await vestingInstance.getCurrentVestedTotalAmount(),
      })
    })

    it('should revert when non-revoker attempts to revoke the vesting', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await assertRevert(vestingInstance.revoke({ from: accounts[5] }))
    })

    it('should revert if vesting is already revoked', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await vestingInstance.revoke({ from: revoker })
      await assertRevert(vestingInstance.revoke({ from: revoker }))
    })

    it('should revert if vesting is non-revocable', async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingRevocable = false
      await createNewVestingInstanceTx(vestingSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await assertRevert(vestingInstance.revoke({ from: revoker }))
    })
  })

  describe('#getInitialVestingAmount', () => {
    it('# should always return the initial vesting amount at the time of construction', async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      const vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      const vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      const initialVestingAmount = await vestingInstance.getInitialVestingAmount()
      assertEqualBN(
        initialVestingAmount,
        vestingDefaultSchedule.vestAmountPerPeriod.multipliedBy(
          vestingDefaultSchedule.vestingNumPeriods
        )
      )
    })
  })

  describe('#refundAndFinalize', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      // wait some time for some gold to vest
      const timeToTravel = 7 * MONTH
      await timeTravel(timeToTravel, web3)
    })

    it('should only be callable by revoker and when revoked', async () => {
      await vestingInstance.revoke({ from: revoker })
      await vestingInstance.refundAndFinalize({ from: revoker })
    })

    it('should revert when revoked but called by a non-revoker', async () => {
      await vestingInstance.revoke({ from: revoker })
      await assertRevert(vestingInstance.refundAndFinalize({ from: accounts[5] }))
    })

    it('should revert when non-revoked but called by a revoker', async () => {
      await assertRevert(vestingInstance.refundAndFinalize({ from: revoker }))
    })

    describe('when revoked()', () => {
      beforeEach(async () => {
        await vestingInstance.revoke({ from: revoker })
      })

      it('should revert when any of the gold is still locked', async () => {
        await vestingInstance.createAccount({ from: revoker })
        await vestingInstance.lockGold(await vestingInstance.getRemainingUnlockedBalance(), {
          from: revoker,
        })
        await assertRevert(vestingInstance.refundAndFinalize({ from: revoker }))
      })

      it('should transfer gold proportions to both beneficiary and revoker when no gold locked', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const revokerBalanceBefore = await goldTokenInstance.balanceOf(revoker)
        const vestedBalanceAtRevoke = await vestingInstance.vestedBalanceAtRevoke()
        const beneficiaryRefundAmount = new BigNumber(vestedBalanceAtRevoke).minus(
          await vestingInstance.totalWithdrawn()
        )
        const revokerRefundAmount = new BigNumber(
          await goldTokenInstance.balanceOf(vestingInstance.address)
        ).minus(beneficiaryRefundAmount)
        await vestingInstance.refundAndFinalize({ from: revoker })
        const contractBalanceAfterFinalize = await goldTokenInstance.balanceOf(
          vestingInstance.address
        )
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        const revokerBalanceAfter = await goldTokenInstance.balanceOf(revoker)

        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          beneficiaryRefundAmount
        )
        assertEqualBN(
          new BigNumber(revokerBalanceAfter).minus(new BigNumber(revokerBalanceBefore)),
          revokerRefundAmount
        )

        assertEqualBN(contractBalanceAfterFinalize, 0)
      })

      it('should destruct vesting instance after finalizing and prevent calling further actions', async () => {
        await vestingInstance.refundAndFinalize({ from: revoker })
        try {
          await vestingInstance.getRemainingUnlockedBalance()
        } catch (ex) {
          return assert.isTrue(true)
        }

        return assert.isTrue(false)
      })
    })
  })

  describe('#lockGold', () => {
    let lockAmount = null
    let vestingInstanceAddress: any
    let vestingInstance: any

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      lockAmount = vestingDefaultSchedule.vestAmountPerPeriod.multipliedBy(
        vestingDefaultSchedule.vestingNumPeriods
      )
    })

    it('beneficiary should lock up any unlocked amount', async () => {
      // beneficiary shall make the vested instance an account
      await vestingInstance.createAccount({ from: beneficiary })
      await vestingInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      assertEqualBN(
        await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address),
        lockAmount
      )
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
        lockAmount
      )
      assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), lockAmount)
      assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), lockAmount)
    })

    it('should revert if vesting instance is not an account', async () => {
      await assertRevert(
        vestingInstance.lockGold(lockAmount, {
          from: beneficiary,
        })
      )
    })

    it('should revert if beneficiary tries to lock up more than there is remaining in the contract', async () => {
      await vestingInstance.createAccount({ from: beneficiary })
      await assertRevert(
        vestingInstance.lockGold(lockAmount.multipliedBy(1.1), {
          from: beneficiary,
        })
      )
    })

    it('should revert if non-beneficiary tries to lock up any unlocked amount', async () => {
      await vestingInstance.createAccount({ from: beneficiary })
      await assertRevert(vestingInstance.lockGold(lockAmount, { from: accounts[6] }))
    })
  })

  describe('#unlockGold', () => {
    let lockAmount: any
    let vestingInstanceAddress: any
    let vestingInstance: any

    beforeEach(async () => {
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      // beneficiary shall make the vested instance an account
      await vestingInstance.createAccount({ from: beneficiary })
      lockAmount = vestingDefaultSchedule.vestAmountPerPeriod.multipliedBy(
        vestingDefaultSchedule.vestingNumPeriods
      )
    })

    it('beneficiary should unlock his locked gold and add a pending withdrawal', async () => {
      // lock the entire vesting amount
      await vestingInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await vestingInstance.unlockGold(lockAmount, {
        from: beneficiary,
      })

      const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
        vestingInstance.address
      )
      assert.equal(values.length, 1)
      assert.equal(timestamps.length, 1)
      assertEqualBN(values[0], lockAmount)
      assertEqualBN(timestamps[0], (await getCurrentBlockchainTimestamp(web3)) + UNLOCKING_PERIOD)

      assertEqualBN(await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address), 0)
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
        0
      )
      assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), 0)
      assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), 0)
    })

    it('should revert if non-beneficiary tries to unlock the locked amount', async () => {
      // lock the entire vesting amount
      await vestingInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertRevert(vestingInstance.unlockGold(lockAmount, { from: accounts[5] }))
    })

    it('should revert if beneficiary in voting tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(vestingInstance.address)
      // lock the entire vesting amount
      await vestingInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertRevert(vestingInstance.unlockGold(lockAmount, { from: accounts[5] }))
    })

    it('should revert if beneficiary with balance requirements tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(vestingInstance.address)
      // lock the entire vesting amount
      await vestingInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // set some balance requirements
      const balanceRequirement = 10
      await mockValidators.setAccountLockedGoldRequirement(
        vestingInstance.address,
        balanceRequirement
      )
      // unlock the latter
      await assertRevert(vestingInstance.unlockGold(lockAmount, { from: beneficiary }))
    })
  })

  describe('#withdrawLockedGold', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const value = 1000
    const index = 0

    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
        vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
        vestingInstance = await VestingInstance.at(vestingInstanceAddress)
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

      describe('when non-beneficiary attempts to withdraw the gold', () => {
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

  describe('#relockGold', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    const pendingWithdrawalValue = 1000
    const index = 0

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await createNewVestingInstanceTx(vestingDefaultSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      await vestingInstance.createAccount({ from: beneficiary })
      await vestingInstance.lockGold(pendingWithdrawalValue, { from: beneficiary })
      await vestingInstance.unlockGold(pendingWithdrawalValue, { from: beneficiary })
    })

    describe('when a pending withdrawal exists', () => {
      describe('when relocking value equal to the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue
        beforeEach(async () => {
          await vestingInstance.relockGold(index, value, { from: beneficiary })
        })

        it("should increase the account's nonvoting locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
            value
          )
        })

        it("should increase the account's total locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address),
            value
          )
        })

        it('should increase the nonvoting locked gold balance', async () => {
          assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), value)
        })

        it('should increase the total locked gold balance', async () => {
          assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), value)
        })

        it('should remove the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
            vestingInstance.address
          )
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
        })
      })

      describe('when relocking value less than the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue - 1
        beforeEach(async () => {
          await vestingInstance.relockGold(index, value, { from: beneficiary })
        })

        it("should increase the account's nonvoting locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountNonvotingLockedGold(vestingInstance.address),
            value
          )
        })

        it("should increase the account's total locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountTotalLockedGold(vestingInstance.address),
            value
          )
        })

        it('should increase the nonvoting locked gold balance', async () => {
          assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), value)
        })

        it('should increase the total locked gold balance', async () => {
          assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), value)
        })

        it('should decrement the value of the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
            vestingInstance.address
          )
          assert.equal(values.length, 1)
          assert.equal(timestamps.length, 1)
          assertEqualBN(values[0], 1)
        })
      })

      describe('when relocking value greater than the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue + 1
        it('should revert', async () => {
          await assertRevert(vestingInstance.relockGold(index, value, { from: beneficiary }))
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(vestingInstance.relockGold(index, pendingWithdrawalValue))
      })
    })
  })

  describe('#withdraw', () => {
    let initialVestingAmount: any
    let vestingInstanceAddress: any
    let vestingInstance: any

    beforeEach(async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingStartTime = Math.round(Date.now() / 1000)
      await createNewVestingInstanceTx(vestingSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      initialVestingAmount = vestingSchedule.vestAmountPerPeriod.multipliedBy(
        vestingSchedule.vestingNumPeriods
      )
    })

    it('should revert before the vesting cliff has passed', async () => {
      const timeToTravel = 0.5 * HOUR
      await timeTravel(timeToTravel, web3)
      await assertRevert(
        vestingInstance.withdraw(initialVestingAmount.div(20), { from: beneficiary })
      )
    })

    it('should revert when paused', async () => {
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      await vestingInstance.pause(300 * DAY, { from: revoker })
      const expectedWithdrawalAmount = initialVestingAmount.div(4)
      await assertRevert(vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary }))
    })

    it('should revert when withdrawable amount is zero', async () => {
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      await assertRevert(vestingInstance.withdraw(new BigNumber(0), { from: beneficiary }))
    })

    describe('when not revoked', () => {
      it('should revert since beneficiary should not be able to withdraw anything within the first quarter', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 2.9 * MONTH
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = await vestingInstance.getCurrentVestedTotalAmount()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(expectedWithdrawalAmount, 0)
        await assertRevert(
          vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        )
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          0
        )
      })

      it('should allow the beneficiary to withdraw 25% of the vested amount right after the beginning of the first quarter', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 3 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialVestingAmount.div(4)
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const totalWithdrawn = await vestingInstance.totalWithdrawn()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should allow the beneficiary to withdraw 50% the vested amount when half of the vesting periods have passed', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialVestingAmount.div(2)
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const totalWithdrawn = await vestingInstance.totalWithdrawn()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should allow the beneficiary to withdraw 75% of the vested amount right after the beginning of the third quarter', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 9 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialVestingAmount.multipliedBy(3).div(4)
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        const totalWithdrawn = await vestingInstance.totalWithdrawn()
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should allow the beneficiary to withdraw 100% of the amount right after the end of the vesting period', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialVestingAmount
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should destruct vesting instance when the entire balance is withdrawn', async () => {
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialVestingAmount
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })

        try {
          await vestingInstance.totalWithdrawn()
          return assert.isTrue(false)
        } catch (ex) {
          return assert.isTrue(true)
        }
      })
    })

    describe('when revoked', () => {
      it('should allow the beneficiary to withdraw up to the vestedBalanceAtRevoke', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        await vestingInstance.revoke({ from: revoker })
        const expectedWithdrawalAmount = await vestingInstance.vestedBalanceAtRevoke()
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const totalWithdrawn = await vestingInstance.totalWithdrawn()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should revert if beneficiary attempts to withdraw more than vestedBalanceAtRevoke', async () => {
        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        await vestingInstance.revoke({ from: revoker })
        const expectedWithdrawalAmount = await vestingInstance.vestedBalanceAtRevoke()
        await assertRevert(
          vestingInstance.withdraw(new BigNumber(expectedWithdrawalAmount).multipliedBy(1.1), {
            from: beneficiary,
          })
        )
      })

      it('should selfdestruct if beneficiary withdraws the entire amount', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        await vestingInstance.revoke({ from: revoker })
        const expectedWithdrawalAmount = await vestingInstance.vestedBalanceAtRevoke()
        await vestingInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )

        try {
          await vestingInstance.totalWithdrawn()
          return assert.isTrue(false)
        } catch (ex) {
          return assert.isTrue(true)
        }
      })
    })
  })

  describe('#getCurrentVestedTotalAmount', () => {
    let vestingInstanceAddress: any
    let vestingInstance: any
    let initialVestingAmount: any

    beforeEach(async () => {
      const vestingSchedule = _.clone(vestingDefaultSchedule)
      vestingSchedule.vestingStartTime = Math.round(Date.now() / 1000)
      await createNewVestingInstanceTx(vestingSchedule, web3)
      vestingInstanceAddress = await vestingFactoryInstance.vestings(beneficiary)
      vestingInstance = await VestingInstance.at(vestingInstanceAddress)
      initialVestingAmount = vestingSchedule.vestAmountPerPeriod.multipliedBy(
        vestingSchedule.vestingNumPeriods
      )
    })

    it('should return zero if before cliff start time', async () => {
      const timeToTravel = 0.5 * HOUR
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = 0
      assertEqualBN(await vestingInstance.getCurrentVestedTotalAmount(), expectedWithdrawalAmount)
    })

    it('should return 25% of the vested amount right after the beginning of the first quarter', async () => {
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialVestingAmount.div(4)
      assertEqualBN(await vestingInstance.getCurrentVestedTotalAmount(), expectedWithdrawalAmount)
    })

    it('should return 50% the vested amount right after the beginning of the second quarter', async () => {
      const timeToTravel = 6 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialVestingAmount.div(2)
      assertEqualBN(await vestingInstance.getCurrentVestedTotalAmount(), expectedWithdrawalAmount)
    })

    it('should return 75% of the vested amount right after the beginning of the third quarter', async () => {
      const timeToTravel = 9 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialVestingAmount.multipliedBy(3).div(4)
      assertEqualBN(await vestingInstance.getCurrentVestedTotalAmount(), expectedWithdrawalAmount)
    })

    it('should return 100% of the amount right after the end of the vesting period', async () => {
      const timeToTravel = 12 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialVestingAmount
      assertEqualBN(await vestingInstance.getCurrentVestedTotalAmount(), expectedWithdrawalAmount)
    })
  })
})
