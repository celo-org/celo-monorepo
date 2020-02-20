import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assertGteBN,
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
  ReleaseGoldFactoryContract,
  ReleaseGoldFactoryInstance,
  ReleaseGoldInstanceContract,
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
    me: 'validating signing key',
    subject: 'validatorSigner',
  },
  attestation: {
    me: 'attestation signing key',
    subject: 'attestationSigner',
  },
}

interface ReleaseGoldInstanceConfig {
  releaseStartTime: number
  releaseCliffTime: number
  numReleasePeriods: number
  releasePeriod: number
  amountReleasedPerPeriod: BigNumber
  revocable: boolean
  beneficiary: string
  releaseOwner: string
  refundAddress: string
  subjectToLiquidityProvision: boolean
  initialDistributionPercentage: number
  canValidate: boolean
  canVote: boolean
}

const ReleaseGoldFactory: ReleaseGoldFactoryContract = artifacts.require('ReleaseGoldFactory')
const ReleaseGoldInstance: ReleaseGoldInstanceContract = artifacts.require('ReleaseGoldInstance')
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

contract('ReleaseGold', (accounts: string[]) => {
  const owner = accounts[0]
  const beneficiary = accounts[1]
  const releaseOwner = accounts[2]
  const refundAddress = accounts[3]
  let accountsInstance: AccountsInstance
  let lockedGoldInstance: LockedGoldInstance
  let goldTokenInstance: GoldTokenInstance
  let releaseGoldFactoryInstance: ReleaseGoldFactoryInstance
  let mockElection: MockElectionInstance
  let mockGovernance: MockGovernanceInstance
  let mockValidators: MockValidatorsInstance
  let registry: RegistryInstance

  const releaseGoldDefaultSchedule: ReleaseGoldInstanceConfig = {
    releaseStartTime: null, // To be adjusted on every run
    releaseCliffTime: HOUR,
    numReleasePeriods: 4,
    releasePeriod: 3 * MONTH,
    amountReleasedPerPeriod: ONE_GOLDTOKEN.div(4),
    revocable: true,
    beneficiary,
    releaseOwner,
    refundAddress,
    subjectToLiquidityProvision: false,
    initialDistributionPercentage: 1000, // No distribution limit
    canValidate: false,
    canVote: true,
  }

  const createNewReleaseGoldInstance = async (
    releaseGoldSchedule: ReleaseGoldInstanceConfig,
    web3: Web3
  ) => {
    releaseGoldSchedule.releaseStartTime = (await getCurrentBlockchainTimestamp(web3)) + 5 * MINUTE
    return releaseGoldFactoryInstance.createReleaseGoldInstance(
      releaseGoldSchedule.releaseStartTime,
      releaseGoldSchedule.releaseCliffTime,
      releaseGoldSchedule.numReleasePeriods,
      releaseGoldSchedule.releasePeriod,
      releaseGoldSchedule.amountReleasedPerPeriod,
      releaseGoldSchedule.revocable,
      releaseGoldSchedule.beneficiary,
      releaseGoldSchedule.releaseOwner,
      releaseGoldSchedule.refundAddress,
      releaseGoldSchedule.subjectToLiquidityProvision,
      releaseGoldSchedule.initialDistributionPercentage,
      releaseGoldSchedule.canValidate,
      releaseGoldSchedule.canVote,
      { from: owner }
    )
  }

  const getCurrentBlockchainTimestamp = async (web3: Web3) => {
    return (await web3.eth.getBlock('latest')).timestamp
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    lockedGoldInstance = await LockedGold.new()
    goldTokenInstance = await GoldToken.new()
    releaseGoldFactoryInstance = await ReleaseGoldFactory.new()
    mockElection = await MockElection.new()
    mockValidators = await MockValidators.new()
    mockGovernance = await MockGovernance.new()

    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, lockedGoldInstance.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldTokenInstance.address)
    await registry.setAddressFor(
      CeloContractName.ReleaseGoldFactory,
      releaseGoldFactoryInstance.address
    )
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.Governance, mockGovernance.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await lockedGoldInstance.initialize(registry.address, UNLOCKING_PERIOD)
    await releaseGoldFactoryInstance.initialize(registry.address)
    await accountsInstance.initialize(registry.address)
    await accountsInstance.createAccount({ from: beneficiary })

    // prefund the releaseGold factory instance with 2 gold tokens to simulate a well-funded factory contract in the genesis block
    await goldTokenInstance.transfer(releaseGoldFactoryInstance.address, ONE_GOLDTOKEN.times(2), {
      from: owner,
    })
  })

  describe('#initialize', () => {
    it('should set the owner', async () => {
      const ReleaseGoldFactoryOwner: string = await releaseGoldFactoryInstance.owner()
      assert.equal(ReleaseGoldFactoryOwner, owner)
    })

    it('should set the registry address', async () => {
      const registryAddress: string = await releaseGoldFactoryInstance.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should revert if already initialized', async () => {
      await assertRevert(releaseGoldFactoryInstance.initialize(registry.address))
    })
  })

  describe('#setRegistry', () => {
    const anAddress: string = accounts[2]

    it('should set the registry when called by the owner', async () => {
      await releaseGoldFactoryInstance.setRegistry(anAddress)
      assert.equal(await releaseGoldFactoryInstance.registry(), anAddress)
    })

    it('should revert when not called by the owner', async () => {
      await assertRevert(releaseGoldFactoryInstance.setRegistry(anAddress, { from: beneficiary }))
    })
  })

  describe('#payable', () => {
    it('should accept gold transfer by default from anyone', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      const releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      await goldTokenInstance.transfer(releaseGoldInstanceAddress, ONE_GOLDTOKEN.times(2), {
        from: accounts[8],
      })
    })
  })

  describe('#creation', () => {
    let newReleaseGoldInstanceTx: any
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    it('should fail if a non-owner attempts to create a releaseGold instance', async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.releaseStartTime =
        (await getCurrentBlockchainTimestamp(web3)) + 5 * MINUTE
      await assertRevert(
        releaseGoldFactoryInstance.createReleaseGoldInstance(
          releaseGoldSchedule.releaseStartTime,
          releaseGoldSchedule.releaseCliffTime,
          releaseGoldSchedule.numReleasePeriods,
          releaseGoldSchedule.releasePeriod,
          releaseGoldSchedule.amountReleasedPerPeriod,
          releaseGoldSchedule.revocable,
          releaseGoldSchedule.beneficiary,
          releaseGoldSchedule.releaseOwner,
          releaseGoldSchedule.refundAddress,
          releaseGoldSchedule.subjectToLiquidityProvision,
          releaseGoldSchedule.initialDistributionPercentage,
          releaseGoldSchedule.canValidate,
          releaseGoldSchedule.canVote,
          { from: accounts[5] }
        )
      )
    })

    it('should revert when releaseGold factory has insufficient balance to create new instance', async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.numReleasePeriods = 3
      releaseGoldSchedule.amountReleasedPerPeriod = ONE_GOLDTOKEN
      await assertRevert(createNewReleaseGoldInstance(releaseGoldSchedule, web3))
    })

    describe('when an instance is properly created', () => {
      beforeEach(async () => {
        newReleaseGoldInstanceTx = await createNewReleaseGoldInstance(
          releaseGoldDefaultSchedule,
          web3
        )
        releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
        releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      })

      it('should create a new releaseGold instance and emit a proper event', async () => {
        const newReleaseGoldInstanceCreatedEvent = _.find(newReleaseGoldInstanceTx.logs, {
          event: 'NewReleaseGoldInstanceCreated',
        })
        assert.exists(newReleaseGoldInstanceCreatedEvent)
        const newReleaseGoldInstanceBeneficiary =
          newReleaseGoldInstanceCreatedEvent.args.beneficiary
        const newReleaseGoldInstanceAddress = newReleaseGoldInstanceCreatedEvent.args.atAddress
        assertLogMatches(newReleaseGoldInstanceCreatedEvent, 'NewReleaseGoldInstanceCreated', {
          beneficiary: newReleaseGoldInstanceBeneficiary,
          atAddress: newReleaseGoldInstanceAddress,
        })
        assert.equal(newReleaseGoldInstanceAddress, releaseGoldInstance.address)
      })

      it('should have associated funds with a schedule upon creation', async () => {
        const allocatedFunds = await goldTokenInstance.balanceOf(releaseGoldInstance.address)
        assertEqualBN(
          allocatedFunds,
          new BigNumber(releaseGoldDefaultSchedule.numReleasePeriods).multipliedBy(
            releaseGoldDefaultSchedule.amountReleasedPerPeriod
          )
        )
      })

      it('should set a beneficiary to releaseGold instance', async () => {
        const releaseGoldBeneficiary = await releaseGoldInstance.beneficiary()
        assert.equal(releaseGoldBeneficiary, releaseGoldDefaultSchedule.beneficiary)
      })

      it('should set a releaseOwner to releaseGold instance', async () => {
        const releaseGoldOwner = await releaseGoldInstance.releaseOwner()
        assert.equal(releaseGoldOwner, releaseGoldDefaultSchedule.releaseOwner)
      })

      it('should set releaseGold number of periods to releaseGold instance', async () => {
        const [, , releaseGoldNumPeriods, ,] = await releaseGoldInstance.releaseSchedule()
        assertEqualBN(releaseGoldNumPeriods, releaseGoldDefaultSchedule.numReleasePeriods)
      })

      it('should set releaseGold amount per period to releaseGold instance', async () => {
        const [, , , , releasedAmountPerPeriod] = await releaseGoldInstance.releaseSchedule()
        assertEqualBN(releasedAmountPerPeriod, releaseGoldDefaultSchedule.amountReleasedPerPeriod)
      })

      it('should set releaseGold period to releaseGold instance', async () => {
        const [, , , releaseGoldPeriodSec] = await releaseGoldInstance.releaseSchedule()
        assertEqualBN(releaseGoldPeriodSec, releaseGoldDefaultSchedule.releasePeriod)
      })

      it('should set releaseGold start time to releaseGold instance', async () => {
        const [releaseGoldStartTime, , , ,] = await releaseGoldInstance.releaseSchedule()
        assertEqualBN(releaseGoldStartTime, releaseGoldDefaultSchedule.releaseStartTime)
      })

      it('should set releaseGold cliff to releaseGold instance', async () => {
        const [, releaseGoldCliffStartTime, , ,] = await releaseGoldInstance.releaseSchedule()
        const releaseGoldCliffStartTimeComputed = new BigNumber(
          releaseGoldDefaultSchedule.releaseStartTime
        ).plus(releaseGoldDefaultSchedule.releaseCliffTime)
        assertEqualBN(releaseGoldCliffStartTime, releaseGoldCliffStartTimeComputed)
      })

      it('should set revocable flag to releaseGold instance', async () => {
        const [releaseGoldRevocable, ,] = await releaseGoldInstance.revocationInfo()
        assert.equal(releaseGoldRevocable, releaseGoldDefaultSchedule.revocable)
      })

      it('should set releaseOwner to releaseGold instance', async () => {
        const releaseGoldOwner = await releaseGoldInstance.releaseOwner()
        assert.equal(releaseGoldOwner, releaseGoldDefaultSchedule.releaseOwner)
      })

      it('should set liquidity provision met to true', async () => {
        const liquidityProvisionMet = await releaseGoldInstance.liquidityProvisionMet()
        assert.equal(liquidityProvisionMet, true)
      })

      it('should have zero total withdrawn on init', async () => {
        const totalWithdrawn = await releaseGoldInstance.totalWithdrawn()
        assertEqualBN(totalWithdrawn, 0)
      })

      it('should be unrevoked on init and have revoke time equal zero', async () => {
        const isRevoked = await releaseGoldInstance.isRevoked()
        assert.equal(isRevoked, false)
        const [, , revokeTime] = await releaseGoldInstance.revocationInfo()
        assertEqualBN(revokeTime, 0)
      })

      it('should have releaseGoldBalanceAtRevoke on init equal to zero', async () => {
        const [, releasedBalanceAtRevoke] = await releaseGoldInstance.revocationInfo()
        assertEqualBN(releasedBalanceAtRevoke, 0)
      })

      it('should revert when releaseGold beneficiary is the null address', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.beneficiary = NULL_ADDRESS
        await assertRevert(createNewReleaseGoldInstance(releaseGoldSchedule, web3))
      })

      it('should revert when releaseGold periods are zero', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.numReleasePeriods = 0
        await assertRevert(createNewReleaseGoldInstance(releaseGoldSchedule, web3))
      })

      it('should revert when released amount per period is zero', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.amountReleasedPerPeriod = new BigNumber('0')
        await assertRevert(createNewReleaseGoldInstance(releaseGoldSchedule, web3))
      })

      it('should overflow for very large combinations of release periods and amount per time', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.numReleasePeriods = Number.MAX_SAFE_INTEGER
        releaseGoldSchedule.amountReleasedPerPeriod = new BigNumber(2).pow(300)
        await assertRevert(createNewReleaseGoldInstance(releaseGoldSchedule, web3))
      })
    })
  })

  describe('#createAccount', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
    })

    describe('when unrevoked', () => {
      it('creates the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await releaseGoldInstance.createAccount({ from: beneficiary })
        isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-beneficiary attempts account creation', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(releaseGoldInstance.createAccount({ from: accounts[2] }))
      })
    })

    describe('when revoked', () => {
      beforeEach(async () => {
        await releaseGoldInstance.revoke({ from: releaseOwner })
      })

      it('reverts if anyone attempts account creation', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(releaseGoldInstance.createAccount({ from: releaseOwner }))
      })
    })
  })

  describe('#setAccount', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const accountName = 'name'
    const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const walletAddress = beneficiary

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
    })

    describe('when unrevoked', () => {
      it('sets the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await releaseGoldInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: beneficiary,
        })
        isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-beneficiary attempts to set the account', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          releaseGoldInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: accounts[2],
          })
        )
      })

      it('should set the name, dataEncryptionKey and walletAddress of the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await releaseGoldInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
          from: beneficiary,
        })
        isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isTrue(isAccount)
        const expectedWalletAddress = await accountsInstance.getWalletAddress(
          releaseGoldInstance.address
        )
        assert.equal(expectedWalletAddress, walletAddress)
        // @ts-ignore
        const expectedKey: string = await accountsInstance.getDataEncryptionKey(
          releaseGoldInstance.address
        )
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(releaseGoldInstance.address)
        assert.equal(expectedName, accountName)
      })

      it('should revert to set the name, dataEncryptionKey and walletAddress of the account by a non-beneficiary', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          releaseGoldInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: releaseOwner,
          })
        )
      })
    })

    describe('when revoked', () => {
      beforeEach(async () => {
        await releaseGoldInstance.revoke({ from: releaseOwner })
      })

      it('reverts if anyone attempts to set the account', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          releaseGoldInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: releaseOwner,
          })
        )
      })

      it('should revert to set the name, dataEncryptionKey and walletAddress of the account', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertRevert(
          releaseGoldInstance.setAccount(accountName, dataEncryptionKey, walletAddress, {
            from: releaseOwner,
          })
        )
      })
    })
  })

  describe('#setAccountName', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const accountName = 'name'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
    })

    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(releaseGoldInstance.setAccountName(accountName, { from: beneficiary }))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await releaseGoldInstance.createAccount({ from: beneficiary })
      })

      describe('when unrevoked', () => {
        it('beneficiary should set the name', async () => {
          await releaseGoldInstance.setAccountName(accountName, { from: beneficiary })
          const result = await accountsInstance.getName(releaseGoldInstance.address)
          assert.equal(result, accountName)
        })

        it('should revert if non-beneficiary attempts to set the name', async () => {
          await assertRevert(releaseGoldInstance.setAccountName(accountName, { from: accounts[2] }))
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await releaseGoldInstance.revoke({ from: releaseOwner })
        })

        it('should revert if anyone attempts to set the name', async () => {
          await assertRevert(
            releaseGoldInstance.setAccountName(accountName, { from: releaseOwner })
          )
        })
      })
    })
  })

  describe('#setAccountWalletAddress', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const walletAddress = beneficiary

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
    })

    describe('when the releaseGold account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(
          releaseGoldInstance.setAccountWalletAddress(walletAddress, { from: beneficiary })
        )
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await releaseGoldInstance.createAccount({ from: beneficiary })
      })

      describe('when unrevoked', () => {
        it('beneficiary should set the walletAddress', async () => {
          await releaseGoldInstance.setAccountWalletAddress(walletAddress, { from: beneficiary })
          const result = await accountsInstance.getWalletAddress(releaseGoldInstance.address)
          assert.equal(result, walletAddress)
        })

        it('should revert if non-beneficiary attempts to set the walletAddress', async () => {
          await assertRevert(
            releaseGoldInstance.setAccountWalletAddress(walletAddress, { from: accounts[2] })
          )
        })

        it('beneficiary should set the NULL_ADDRESS', async () => {
          await releaseGoldInstance.setAccountWalletAddress(NULL_ADDRESS, { from: beneficiary })
          const result = await accountsInstance.getWalletAddress(releaseGoldInstance.address)
          assert.equal(result, NULL_ADDRESS)
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await releaseGoldInstance.revoke({ from: releaseOwner })
        })

        it('should revert if anyone attempts to set the walletAddress', async () => {
          await assertRevert(
            releaseGoldInstance.setAccountWalletAddress(walletAddress, { from: releaseOwner })
          )
        })
      })
    })
  })

  describe('#setAccountMetadataURL', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const metadataURL = 'meta'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
    })

    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(
          releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: beneficiary })
        )
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await releaseGoldInstance.createAccount({ from: beneficiary })
      })

      describe('when unrevoked', () => {
        it('only beneficiary should set the metadataURL', async () => {
          await releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: beneficiary })
          const result = await accountsInstance.getMetadataURL(releaseGoldInstance.address)
          assert.equal(result, metadataURL)
        })

        it('should revert if non-beneficiary attempts to set the metadataURL', async () => {
          await assertRevert(
            releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: accounts[2] })
          )
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await releaseGoldInstance.revoke({ from: releaseOwner })
        })

        it('should revert if anyone attempts to set the metadataURL', async () => {
          await assertRevert(
            releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: releaseOwner })
          )
        })
      })
    })
  })

  describe('#setAccountDataEncryptionKey', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const longDataEncryptionKey =
      '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
      '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      await releaseGoldInstance.createAccount({ from: beneficiary })
    })

    it('beneficiary should set dataEncryptionKey', async () => {
      await releaseGoldInstance.setAccountDataEncryptionKey(dataEncryptionKey, {
        from: beneficiary,
      })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        releaseGoldInstance.address
      )
      assert.equal(fetchedKey, dataEncryptionKey)
    })

    it('should revert if non-beneficiary attempts to set dataEncryptionKey', async () => {
      await assertRevert(
        releaseGoldInstance.setAccountDataEncryptionKey(dataEncryptionKey, { from: accounts[2] })
      )
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros = '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      await releaseGoldInstance.setAccountDataEncryptionKey(keyWithZeros, { from: beneficiary })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        releaseGoldInstance.address
      )
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      await assertRevert(
        releaseGoldInstance.setAccountDataEncryptionKey('0x32132931293', { from: beneficiary })
      )
    })

    it('should allow a key that is longer than 33 bytes', async () => {
      await releaseGoldInstance.setAccountDataEncryptionKey(longDataEncryptionKey, {
        from: beneficiary,
      })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        releaseGoldInstance.address
      )
      assert.equal(fetchedKey, longDataEncryptionKey)
    })
  })

  describe('#setMaxDistribution', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
    })

    describe('when the max distribution is set to 50%', () => {
      beforeEach(async () => {
        await releaseGoldInstance.setMaxDistribution(500, { from: releaseOwner })
      })

      it('should set max distribution to 0.5 gold', async () => {
        const maxDistribution = await releaseGoldInstance.maxDistribution()
        assertEqualBN(maxDistribution, ONE_GOLDTOKEN.div(2))
      })
    })

    describe('when the max distribution is set to 100%', () => {
      beforeEach(async () => {
        await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
      })

      it('should set max distribution to max uint256', async () => {
        const maxDistribution = await releaseGoldInstance.maxDistribution()
        assertGteBN(maxDistribution, ONE_GOLDTOKEN)
      })
    })
  })

  describe('authorization tests:', () => {
    Object.keys(authorizationTestDescriptions).forEach((key) => {
      let authorizationTest: any
      let releaseGoldInstanceAddress: any
      let releaseGoldInstance: any
      const authorized = accounts[4] // the account that is to be authorized for whatever role
      let sig: any

      describe(`#authorize${_.upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
        beforeEach(async () => {
          const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
          releaseGoldSchedule.revocable = false
          releaseGoldSchedule.refundAddress = '0x0000000000000000000000000000000000000000'
          releaseGoldSchedule.canValidate = true
          await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
          releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
          releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
          await releaseGoldInstance.createAccount({ from: beneficiary })

          authorizationTests.voting = {
            fn: releaseGoldInstance.authorizeVoteSigner,
            eventName: 'VoteSignerAuthorized',
            getAuthorizedFromAccount: accountsInstance.getVoteSigner,
            authorizedSignerToAccount: accountsInstance.voteSignerToAccount,
          }
          authorizationTests.validating = {
            fn: releaseGoldInstance.authorizeValidatorSigner,
            eventName: 'ValidatorSignerAuthorized',
            getAuthorizedFromAccount: accountsInstance.getValidatorSigner,
            authorizedSignerToAccount: accountsInstance.validatorSignerToAccount,
          }
          authorizationTests.attestation = {
            fn: releaseGoldInstance.authorizeAttestationSigner,
            eventName: 'AttestationSignerAuthorized',
            getAuthorizedFromAccount: accountsInstance.getAttestationSigner,
            authorizedSignerToAccount: accountsInstance.attestationSignerToAccount,
          }
          authorizationTest = authorizationTests[key]
          sig = await getParsedSignatureOfAddress(web3, releaseGoldInstance.address, authorized)
        })

        it(`should set the authorized ${authorizationTestDescriptions[key].me}`, async () => {
          await authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
          assert.equal(await accountsInstance.authorizedBy(authorized), releaseGoldInstance.address)
          assert.equal(
            await authorizationTest.getAuthorizedFromAccount(releaseGoldInstance.address),
            authorized
          )
          assert.equal(
            await authorizationTest.authorizedSignerToAccount(authorized),
            releaseGoldInstance.address
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
            releaseGoldInstance.address,
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
            releaseGoldInstance.address,
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
            newSig = await getParsedSignatureOfAddress(
              web3,
              releaseGoldInstance.address,
              newAuthorized
            )
            await authorizationTest.fn(newAuthorized, newSig.v, newSig.r, newSig.s, {
              from: beneficiary,
            })
          })

          it(`should set the new authorized ${authorizationTestDescriptions[key].me}`, async () => {
            assert.equal(
              await accountsInstance.authorizedBy(newAuthorized),
              releaseGoldInstance.address
            )
            assert.equal(
              await authorizationTest.getAuthorizedFromAccount(releaseGoldInstance.address),
              newAuthorized
            )
            assert.equal(
              await authorizationTest.authorizedSignerToAccount(newAuthorized),
              releaseGoldInstance.address
            )
          })

          it('should preserve the previous authorization', async () => {
            assert.equal(
              await accountsInstance.authorizedBy(authorized),
              releaseGoldInstance.address
            )
          })
        })
      })
    })
  })

  describe('#revoke', () => {
    it('releaseOwner should be able to revoke the releaseGold', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      const releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      const releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      const releaseOwnereleaseGoldTx = await releaseGoldInstance.revoke({ from: releaseOwner })
      const revokeBlockTimestamp = await getCurrentBlockchainTimestamp(web3)
      const [, , releaseGoldRevokeTime] = await releaseGoldInstance.revocationInfo()
      assertEqualBN(revokeBlockTimestamp, releaseGoldRevokeTime)
      assert.isTrue(await releaseGoldInstance.isRevoked())
      assertLogMatches(releaseOwnereleaseGoldTx.logs[0], 'ReleaseScheduleRevoked', {
        revokeTimestamp: revokeBlockTimestamp,
        releasedBalanceAtRevoke: await releaseGoldInstance.getCurrentReleasedTotalAmount(),
      })
    })

    it('should revert when non-releaseOwner attempts to revoke the releaseGold', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      const releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      const releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      await assertRevert(releaseGoldInstance.revoke({ from: accounts[5] }))
    })

    it('should revert if releaseGold is already revoked', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      const releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      const releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      await releaseGoldInstance.revoke({ from: releaseOwner })
      await assertRevert(releaseGoldInstance.revoke({ from: releaseOwner }))
    })

    it('should revert if releaseGold is non-revocable', async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.revocable = false
      releaseGoldSchedule.refundAddress = '0x0000000000000000000000000000000000000000'
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
      const releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      const releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      await assertRevert(releaseGoldInstance.revoke({ from: releaseOwner }))
    })
  })

  describe('#refundAndFinalize', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      // wait some time for some gold to release
      const timeToTravel = 7 * MONTH
      await timeTravel(timeToTravel, web3)
    })

    it('should only be callable by releaseOwner and when revoked', async () => {
      await releaseGoldInstance.revoke({ from: releaseOwner })
      await releaseGoldInstance.refundAndFinalize({ from: releaseOwner })
    })

    it('should revert when revoked but called by a non-releaseOwner', async () => {
      await releaseGoldInstance.revoke({ from: releaseOwner })
      await assertRevert(releaseGoldInstance.refundAndFinalize({ from: accounts[5] }))
    })

    it('should revert when non-revoked but called by a releaseOwner', async () => {
      await assertRevert(releaseGoldInstance.refundAndFinalize({ from: releaseOwner }))
    })

    describe('when revoked()', () => {
      beforeEach(async () => {
        await releaseGoldInstance.revoke({ from: releaseOwner })
      })

      it('should transfer gold proportions to both beneficiary and refundAddress when no gold locked', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const refundAddressBalanceBefore = await goldTokenInstance.balanceOf(refundAddress)
        const [, releasedBalanceAtRevoke] = await releaseGoldInstance.revocationInfo()
        const beneficiaryRefundAmount = new BigNumber(releasedBalanceAtRevoke).minus(
          await releaseGoldInstance.totalWithdrawn()
        )
        const refundAddressRefundAmount = new BigNumber(
          await goldTokenInstance.balanceOf(releaseGoldInstance.address)
        ).minus(beneficiaryRefundAmount)
        await releaseGoldInstance.refundAndFinalize({ from: releaseOwner })
        const contractBalanceAfterFinalize = await goldTokenInstance.balanceOf(
          releaseGoldInstance.address
        )
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        const refundAddressBalanceAfter = await goldTokenInstance.balanceOf(refundAddress)

        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          beneficiaryRefundAmount
        )
        assertEqualBN(
          new BigNumber(refundAddressBalanceAfter).minus(new BigNumber(refundAddressBalanceBefore)),
          refundAddressRefundAmount
        )

        assertEqualBN(contractBalanceAfterFinalize, 0)
      })

      it('should destruct releaseGold instance after finalizing and prevent calling further actions', async () => {
        await releaseGoldInstance.refundAndFinalize({ from: releaseOwner })
        try {
          await releaseGoldInstance.getRemainingUnlockedBalance()
        } catch (ex) {
          return assert.isTrue(true)
        }

        return assert.isTrue(false)
      })
    })
  })

  describe('#lockGold', () => {
    let lockAmount = null
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      lockAmount = releaseGoldDefaultSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldDefaultSchedule.numReleasePeriods
      )
    })

    it('beneficiary should lock up any unlocked amount', async () => {
      // beneficiary shall make the released gold instance an account
      await releaseGoldInstance.createAccount({ from: beneficiary })
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      assertEqualBN(
        await lockedGoldInstance.getAccountTotalLockedGold(releaseGoldInstance.address),
        lockAmount
      )
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(releaseGoldInstance.address),
        lockAmount
      )
      assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), lockAmount)
      assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), lockAmount)
    })

    it('should revert if releaseGold instance is not an account', async () => {
      await assertRevert(
        releaseGoldInstance.lockGold(lockAmount, {
          from: beneficiary,
        })
      )
    })

    it('should revert if beneficiary tries to lock up more than there is remaining in the contract', async () => {
      await releaseGoldInstance.createAccount({ from: beneficiary })
      await assertRevert(
        releaseGoldInstance.lockGold(lockAmount.multipliedBy(1.1), {
          from: beneficiary,
        })
      )
    })

    it('should revert if non-beneficiary tries to lock up any unlocked amount', async () => {
      await releaseGoldInstance.createAccount({ from: beneficiary })
      await assertRevert(releaseGoldInstance.lockGold(lockAmount, { from: accounts[6] }))
    })
  })

  describe('#unlockGold', () => {
    let lockAmount: any
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      // beneficiary shall make the released gold instance an account
      await releaseGoldInstance.createAccount({ from: beneficiary })
      lockAmount = releaseGoldDefaultSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldDefaultSchedule.numReleasePeriods
      )
    })

    it('beneficiary should unlock his locked gold and add a pending withdrawal', async () => {
      // lock the entire releaseGold amount
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await releaseGoldInstance.unlockGold(lockAmount, {
        from: beneficiary,
      })

      const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
        releaseGoldInstance.address
      )
      assert.equal(values.length, 1)
      assert.equal(timestamps.length, 1)
      assertEqualBN(values[0], lockAmount)
      assertEqualBN(timestamps[0], (await getCurrentBlockchainTimestamp(web3)) + UNLOCKING_PERIOD)

      assertEqualBN(
        await lockedGoldInstance.getAccountTotalLockedGold(releaseGoldInstance.address),
        0
      )
      assertEqualBN(
        await lockedGoldInstance.getAccountNonvotingLockedGold(releaseGoldInstance.address),
        0
      )
      assertEqualBN(await lockedGoldInstance.getNonvotingLockedGold(), 0)
      assertEqualBN(await lockedGoldInstance.getTotalLockedGold(), 0)
    })

    it('should revert if non-beneficiary tries to unlock the locked amount', async () => {
      // lock the entire releaseGold amount
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertRevert(releaseGoldInstance.unlockGold(lockAmount, { from: accounts[5] }))
    })

    it('should revert if beneficiary in voting tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(releaseGoldInstance.address)
      // lock the entire releaseGold amount
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertRevert(releaseGoldInstance.unlockGold(lockAmount, { from: accounts[5] }))
    })

    it('should revert if beneficiary with balance requirements tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(releaseGoldInstance.address)
      // lock the entire releaseGold amount
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // set some balance requirements
      const balanceRequirement = 10
      await mockValidators.setAccountLockedGoldRequirement(
        releaseGoldInstance.address,
        balanceRequirement
      )
      // unlock the latter
      await assertRevert(releaseGoldInstance.unlockGold(lockAmount, { from: beneficiary }))
    })
  })

  describe('#withdrawLockedGold', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const value = 1000
    const index = 0

    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
        releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
        releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
        await releaseGoldInstance.createAccount({ from: beneficiary })
        await releaseGoldInstance.lockGold(value, { from: beneficiary })
        await releaseGoldInstance.unlockGold(value, { from: beneficiary })
      })

      describe('when it is after the availablity time', () => {
        beforeEach(async () => {
          await timeTravel(UNLOCKING_PERIOD, web3)
          await releaseGoldInstance.withdrawLockedGold(index, { from: beneficiary })
        })

        it('should remove the pending withdrawal', async () => {
          const [values, timestamps] = await lockedGoldInstance.getPendingWithdrawals(
            releaseGoldInstance.address
          )
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
        })
      })

      describe('when it is before the availablity time', () => {
        it('should revert', async () => {
          await assertRevert(releaseGoldInstance.withdrawLockedGold(index, { from: beneficiary }))
        })
      })

      describe('when non-beneficiary attempts to withdraw the gold', () => {
        it('should revert', async () => {
          await assertRevert(releaseGoldInstance.withdrawLockedGold(index, { from: accounts[4] }))
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(releaseGoldInstance.withdrawLockedGold(index, { from: beneficiary }))
      })
    })
  })

  describe('#relockGold', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    const pendingWithdrawalValue = 1000
    const index = 0

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      await releaseGoldInstance.createAccount({ from: beneficiary })
      await releaseGoldInstance.lockGold(pendingWithdrawalValue, { from: beneficiary })
      await releaseGoldInstance.unlockGold(pendingWithdrawalValue, { from: beneficiary })
    })

    describe('when a pending withdrawal exists', () => {
      describe('when relocking value equal to the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue
        beforeEach(async () => {
          await releaseGoldInstance.relockGold(index, value, { from: beneficiary })
        })

        it("should increase the account's nonvoting locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountNonvotingLockedGold(releaseGoldInstance.address),
            value
          )
        })

        it("should increase the account's total locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountTotalLockedGold(releaseGoldInstance.address),
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
            releaseGoldInstance.address
          )
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
        })
      })

      describe('when relocking value less than the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue - 1
        beforeEach(async () => {
          await releaseGoldInstance.relockGold(index, value, { from: beneficiary })
        })

        it("should increase the account's nonvoting locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountNonvotingLockedGold(releaseGoldInstance.address),
            value
          )
        })

        it("should increase the account's total locked gold balance", async () => {
          assertEqualBN(
            await lockedGoldInstance.getAccountTotalLockedGold(releaseGoldInstance.address),
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
            releaseGoldInstance.address
          )
          assert.equal(values.length, 1)
          assert.equal(timestamps.length, 1)
          assertEqualBN(values[0], 1)
        })
      })

      describe('when relocking value greater than the value of the pending withdrawal', () => {
        const value = pendingWithdrawalValue + 1
        it('should revert', async () => {
          await assertRevert(releaseGoldInstance.relockGold(index, value, { from: beneficiary }))
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertRevert(releaseGoldInstance.relockGold(index, pendingWithdrawalValue))
      })
    })
  })

  describe('#withdraw', () => {
    let initialreleaseGoldAmount: any
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any

    beforeEach(async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.releaseStartTime = Math.round(Date.now() / 1000)
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      initialreleaseGoldAmount = releaseGoldSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldSchedule.numReleasePeriods
      )
      await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
    })

    it('should revert before the release cliff has passed', async () => {
      const timeToTravel = 0.5 * HOUR
      await timeTravel(timeToTravel, web3)
      await assertRevert(
        releaseGoldInstance.withdraw(initialreleaseGoldAmount.div(20), { from: beneficiary })
      )
    })

    it('should revert when withdrawable amount is zero', async () => {
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      await assertRevert(releaseGoldInstance.withdraw(new BigNumber(0), { from: beneficiary }))
    })

    describe('when not revoked', () => {
      it('should revert since beneficiary should not be able to withdraw anything within the first quarter', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 2.9 * MONTH
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = await releaseGoldInstance.getCurrentReleasedTotalAmount()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(expectedWithdrawalAmount, 0)
        await assertRevert(
          releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        )
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          0
        )
      })

      it('should allow the beneficiary to withdraw 25% of the released amount of gold right after the beginning of the first quarter', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 3 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialreleaseGoldAmount.div(4)
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const totalWithdrawn = await releaseGoldInstance.totalWithdrawn()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should allow the beneficiary to withdraw 50% the released amount of gold when half of the release periods have passed', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialreleaseGoldAmount.div(2)
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const totalWithdrawn = await releaseGoldInstance.totalWithdrawn()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should allow the beneficiary to withdraw 75% of the released amount of gold right after the beginning of the third quarter', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 9 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialreleaseGoldAmount.multipliedBy(3).div(4)
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        const totalWithdrawn = await releaseGoldInstance.totalWithdrawn()
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should allow the beneficiary to withdraw 100% of the amount right after the end of the release period', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialreleaseGoldAmount
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should destruct releaseGold instance when the entire balance is withdrawn', async () => {
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        const expectedWithdrawalAmount = initialreleaseGoldAmount
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })

        try {
          await releaseGoldInstance.totalWithdrawn()
          return assert.isTrue(false)
        } catch (ex) {
          return assert.isTrue(true)
        }
      })

      describe('when rewards are simulated', () => {
        describe('when max distribution is 100%', () => {
          beforeEach(async () => {
            // Simulate rewards of 0.5 Gold
            await goldTokenInstance.transfer(releaseGoldInstanceAddress, ONE_GOLDTOKEN.div(2), {
              from: owner,
            })
            // Default distribution is 100%
          })

          describe('when the grant has fully released', () => {
            beforeEach(async () => {
              const timeToTravel = 12 * MONTH + 1 * DAY
              await timeTravel(timeToTravel, web3)
            })

            it('should allow distribution of initial balance and rewards', async () => {
              const expectedWithdrawalAmount = ONE_GOLDTOKEN.plus(ONE_GOLDTOKEN.div(2))
              await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
            })
          })

          describe('when the grant is only halfway released', () => {
            beforeEach(async () => {
              const timeToTravel = 6 * MONTH + 1 * DAY
              await timeTravel(timeToTravel, web3)
            })

            it('should scale released amount to 50% of initial balance plus rewards', async () => {
              const expectedWithdrawalAmount = ONE_GOLDTOKEN.multipliedBy(0.75)
              await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
            })

            it('should not allow withdrawal of more than 50% gold', async () => {
              const unexpectedWithdrawalAmount = ONE_GOLDTOKEN.multipliedBy(0.76)
              await assertRevert(
                releaseGoldInstance.withdraw(unexpectedWithdrawalAmount, { from: beneficiary })
              )
            })
          })
        })

        // Max distribution should set a static value of `percentage` of total funds at call time of `setMaxDistribution`
        // So this is testing that the maxDistribution is unrelated to rewards, except the 100% special case.
        describe('when max distribution is 50% and all gold is released', () => {
          beforeEach(async () => {
            await releaseGoldInstance.setMaxDistribution(500, { from: releaseOwner })
            // Simulate rewards of 0.5 Gold
            // Have to send after setting max distribution as mentioned above
            await goldTokenInstance.transfer(releaseGoldInstanceAddress, ONE_GOLDTOKEN.div(2), {
              from: owner,
            })
            const timeToTravel = 12 * MONTH + 1 * DAY
            await timeTravel(timeToTravel, web3)
          })

          it('should only allow withdrawal of 50% of initial grant (not including rewards)', async () => {
            const expectedWithdrawalAmount = ONE_GOLDTOKEN.div(2)
            await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
            const unexpectedWithdrawalAmount = ONE_GOLDTOKEN.multipliedBy(0.51)
            await assertRevert(
              releaseGoldInstance.withdraw(unexpectedWithdrawalAmount, { from: beneficiary })
            )
          })
        })
      })
    })

    describe('when revoked', () => {
      it('should allow the beneficiary to withdraw up to the releasedBalanceAtRevoke', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        await releaseGoldInstance.revoke({ from: releaseOwner })
        const [, expectedWithdrawalAmount] = await releaseGoldInstance.revocationInfo()
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const totalWithdrawn = await releaseGoldInstance.totalWithdrawn()
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
        assertEqualBN(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )
      })

      it('should revert if beneficiary attempts to withdraw more than releasedBalanceAtRevoke', async () => {
        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        await releaseGoldInstance.revoke({ from: releaseOwner })
        const [, expectedWithdrawalAmount] = await releaseGoldInstance.revocationInfo()
        await assertRevert(
          releaseGoldInstance.withdraw(new BigNumber(expectedWithdrawalAmount).multipliedBy(1.1), {
            from: beneficiary,
          })
        )
      })

      it('should selfdestruct if beneficiary withdraws the entire amount', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
        await releaseGoldInstance.revoke({ from: releaseOwner })
        const [, expectedWithdrawalAmount] = await releaseGoldInstance.revocationInfo()
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
        const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

        assertEqualBN(
          new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
          expectedWithdrawalAmount
        )

        try {
          await releaseGoldInstance.totalWithdrawn()
          return assert.isTrue(false)
        } catch (ex) {
          return assert.isTrue(true)
        }
      })
    })

    describe('when max distribution is set', () => {
      let beneficiaryBalanceBefore: any
      beforeEach(async () => {
        beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
      })

      describe('when max distribution is 50%', () => {
        beforeEach(async () => {
          await releaseGoldInstance.setMaxDistribution(500, { from: releaseOwner })
        })

        it('should allow withdrawal of 50%', async () => {
          const expectedWithdrawalAmount = initialreleaseGoldAmount.multipliedBy(0.5)
          await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
          const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

          assertEqualBN(
            new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
            expectedWithdrawalAmount
          )
        })

        it('should revert on withdrawal of more than 50%', async () => {
          await assertRevert(
            releaseGoldInstance.withdraw(initialreleaseGoldAmount, { from: beneficiary })
          )
        })
      })

      describe('when max distribution is 100%', () => {
        beforeEach(async () => {
          await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
        })

        it('should allow withdrawal of all gold', async () => {
          const expectedWithdrawalAmount = initialreleaseGoldAmount
          await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
          const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

          assertEqualBN(
            new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
            expectedWithdrawalAmount
          )
        })
      })
    })

    describe('when the liquidity provision is observed and set false', () => {
      beforeEach(async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.subjectToLiquidityProvision = true
        await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
        // Withdraw `beforeEach` creates one instance, have to grab the second
        releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 1)
        releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
      })

      it('should revert on withdraw of any amount', async () => {
        await assertRevert(
          releaseGoldInstance.withdraw(initialreleaseGoldAmount.multipliedBy(0.5), {
            from: beneficiary,
          })
        )
        await assertRevert(
          releaseGoldInstance.withdraw(initialreleaseGoldAmount, { from: beneficiary })
        )
      })
    })
  })

  describe('#getCurrentReleasedTotalAmount', () => {
    let releaseGoldInstanceAddress: any
    let releaseGoldInstance: any
    let initialreleaseGoldAmount: any

    beforeEach(async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.releaseStartTime = Math.round(Date.now() / 1000)
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
      releaseGoldInstanceAddress = await releaseGoldFactoryInstance.releases(beneficiary, 0)
      releaseGoldInstance = await ReleaseGoldInstance.at(releaseGoldInstanceAddress)
      initialreleaseGoldAmount = releaseGoldSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldSchedule.numReleasePeriods
      )
    })

    it('should return zero if before cliff start time', async () => {
      const timeToTravel = 0.5 * HOUR
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = 0
      assertEqualBN(
        await releaseGoldInstance.getCurrentReleasedTotalAmount(),
        expectedWithdrawalAmount
      )
    })

    it('should return 25% of the released amount of gold right after the beginning of the first quarter', async () => {
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialreleaseGoldAmount.div(4)
      assertEqualBN(
        await releaseGoldInstance.getCurrentReleasedTotalAmount(),
        expectedWithdrawalAmount
      )
    })

    it('should return 50% the released amount of gold right after the beginning of the second quarter', async () => {
      const timeToTravel = 6 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialreleaseGoldAmount.div(2)
      assertEqualBN(
        await releaseGoldInstance.getCurrentReleasedTotalAmount(),
        expectedWithdrawalAmount
      )
    })

    it('should return 75% of the released amount of gold right after the beginning of the third quarter', async () => {
      const timeToTravel = 9 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialreleaseGoldAmount.multipliedBy(3).div(4)
      assertEqualBN(
        await releaseGoldInstance.getCurrentReleasedTotalAmount(),
        expectedWithdrawalAmount
      )
    })

    it('should return 100% of the amount right after the end of the releaseGold period', async () => {
      const timeToTravel = 12 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialreleaseGoldAmount
      assertEqualBN(
        await releaseGoldInstance.getCurrentReleasedTotalAmount(),
        expectedWithdrawalAmount
      )
    })
  })
})
