import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assertGteBN,
  assertLogMatches,
  assertSameAddress,
  // eslint-disable-next-line: ordered-imports
  assertTransactionRevertWithReason,
  assertTransactionRevertWithoutReason,
  expectBigNumberInRange,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
// eslint-disable-next-line: ordered-imports
import { Signature, addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import { BigNumber } from 'bignumber.js'
import _ from 'lodash'
import {
  AccountsContract,
  AccountsInstance,
  FreezerContract,
  FreezerInstance,
  GoldTokenContract,
  GoldTokenInstance,
  LockedGoldContract,
  LockedGoldInstance,
  MockElectionContract,
  MockElectionInstance,
  MockGovernanceContract,
  MockGovernanceInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
  ReleaseGoldContract,
  ReleaseGoldInstance,
} from 'types'
import Web3 from 'web3'

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

const isTest = true

interface ReleaseGoldConfig {
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
  initialDistributionRatio: number
  canValidate: boolean
  canVote: boolean
}

interface ReleaseSchedule {
  // Timestamp (in UNIX time) that releasing begins.
  releaseStartTime: number
  // Timestamp (in UNIX time) of the releasing cliff.
  releaseCliff: number
  // Number of release periods.
  numReleasePeriods: BigNumber
  // Duration (in seconds) of one period.
  releasePeriod: number
  // Amount that is to be released per period.
  amountReleasedPerPeriod: number
}
interface RevocationInfo {
  // Indicates if the contract is revocable.
  revocable: boolean
  // Indicates if the contract can expire `EXPIRATION_TIME` after releasing finishes.
  canExpire: boolean
  // Released gold instance balance at time of revocation.
  releasedBalanceAtRevoke: BigNumber
  // The time at which the release schedule was revoked.
  revokeTime: number
}

const Accounts: AccountsContract = artifacts.require('Accounts')
const Freezer: FreezerContract = artifacts.require('Freezer')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const LockedGold: LockedGoldContract = artifacts.require('LockedGold')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockGovernance: MockGovernanceContract = artifacts.require('MockGovernance')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Registry: RegistryContract = artifacts.require('Registry')
const ReleaseGold: ReleaseGoldContract = artifacts.require('ReleaseGold')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'
// @ts-ignore
ReleaseGold.numberFormat = 'BigNumber'
// @ts-ignore
MockStableToken.numberFormat = 'BigNumber'
// @ts-ignore
GoldToken.numberFormat = 'BigNumber'

const MINUTE = 60
const HOUR = 60 * 60
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const UNLOCKING_PERIOD = 3 * DAY

contract('ReleaseGold', (accounts: string[]) => {
  const owner = accounts[0]
  const beneficiary = accounts[1]
  const walletAddress = beneficiary

  const releaseOwner = accounts[2]
  const refundAddress = accounts[3]
  const newBeneficiary = accounts[4]
  let accountsInstance: AccountsInstance
  let freezerInstance: FreezerInstance
  let goldTokenInstance: GoldTokenInstance
  let lockedGoldInstance: LockedGoldInstance
  let mockElection: MockElectionInstance
  let mockGovernance: MockGovernanceInstance
  let mockValidators: MockValidatorsInstance
  let mockStableToken: MockStableTokenInstance
  let registry: RegistryInstance
  let releaseGoldInstance: ReleaseGoldInstance
  let proofOfWalletOwnership: Signature
  const TOTAL_AMOUNT = ONE_GOLDTOKEN.times(10)

  const releaseGoldDefaultSchedule: ReleaseGoldConfig = {
    releaseStartTime: null, // To be adjusted on every run
    releaseCliffTime: HOUR,
    numReleasePeriods: 4,
    releasePeriod: 3 * MONTH,
    amountReleasedPerPeriod: TOTAL_AMOUNT.div(4),
    revocable: true,
    beneficiary,
    releaseOwner,
    refundAddress,
    subjectToLiquidityProvision: false,
    initialDistributionRatio: 1000, // No distribution limit
    canVote: true,
    canValidate: false,
  }

  const createNewReleaseGoldInstance = async (
    releaseGoldSchedule: ReleaseGoldConfig,
    web3: Web3,
    override = {
      prefund: true,
      startReleasing: false,
    }
  ) => {
    const startDelay = 5 * MINUTE
    releaseGoldSchedule.releaseStartTime = (await getCurrentBlockchainTimestamp(web3)) + startDelay
    releaseGoldInstance = await ReleaseGold.new(isTest)
    if (override.prefund) {
      await goldTokenInstance.transfer(
        releaseGoldInstance.address,
        releaseGoldSchedule.amountReleasedPerPeriod.multipliedBy(
          releaseGoldSchedule.numReleasePeriods
        ),
        {
          from: owner,
        }
      )
    }
    await releaseGoldInstance.initialize(
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
      releaseGoldSchedule.initialDistributionRatio,
      releaseGoldSchedule.canValidate,
      releaseGoldSchedule.canVote,
      registry.address,
      { from: owner }
    )
    if (override.startReleasing) {
      await timeTravel(
        startDelay + releaseGoldSchedule.releaseCliffTime + releaseGoldSchedule.releasePeriod,
        web3
      )
    }
  }

  const getCurrentBlockchainTimestamp = (web3: Web3): Promise<number> =>
    web3.eth.getBlock('latest').then((block) => Number(block.timestamp))

  beforeEach(async () => {
    accountsInstance = await Accounts.new(true)
    freezerInstance = await Freezer.new(true)
    goldTokenInstance = await GoldToken.new(true)
    lockedGoldInstance = await LockedGold.new(true)
    mockElection = await MockElection.new()
    mockGovernance = await MockGovernance.new()
    mockValidators = await MockValidators.new()
    mockStableToken = await MockStableToken.new()

    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.Freezer, freezerInstance.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldTokenInstance.address)
    await registry.setAddressFor(CeloContractName.Governance, mockGovernance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, lockedGoldInstance.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await registry.setAddressFor(CeloContractName.StableToken, mockStableToken.address)
    await lockedGoldInstance.initialize(registry.address, UNLOCKING_PERIOD)
    await goldTokenInstance.initialize(registry.address)
    await accountsInstance.initialize(registry.address)
    await accountsInstance.createAccount({ from: beneficiary })
  })

  describe('#initialize', () => {
    it('should indicate isFunded() if deployment is prefunded', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3, {
        prefund: true,
        startReleasing: false,
      })
      const isFunded = await releaseGoldInstance.isFunded()
      assert.isTrue(isFunded)
    })

    it('should not indicate isFunded() (and not revert) if deployment is not prefunded', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3, {
        prefund: false,
        startReleasing: false,
      })
      const isFunded = await releaseGoldInstance.isFunded()
      assert.isFalse(isFunded)
    })
  })

  describe('#payable', () => {
    it('should accept gold transfer by default from anyone', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      await goldTokenInstance.transfer(releaseGoldInstance.address, ONE_GOLDTOKEN.times(2), {
        from: accounts[8],
      })
    })

    it('should not update isFunded() if schedule principle not fulfilled', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3, {
        prefund: false,
        startReleasing: false,
      })
      const insufficientPrinciple = releaseGoldDefaultSchedule.amountReleasedPerPeriod
        .multipliedBy(releaseGoldDefaultSchedule.numReleasePeriods)
        .minus(1)
      await goldTokenInstance.transfer(releaseGoldInstance.address, insufficientPrinciple, {
        from: owner,
      })
      const isFunded = await releaseGoldInstance.isFunded()
      assert.isFalse(isFunded)
    })

    it('should update isFunded() if schedule principle is fulfilled after deployment', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3, {
        prefund: false,
        startReleasing: false,
      })
      const sufficientPrinciple = releaseGoldDefaultSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldDefaultSchedule.numReleasePeriods
      )
      await goldTokenInstance.transfer(releaseGoldInstance.address, sufficientPrinciple, {
        from: owner,
      })
      const isFunded = await releaseGoldInstance.isFunded()
      assert.isTrue(isFunded)
    })

    it('should update isFunded() if schedule principle not fulfilled but has begun releasing', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3, {
        prefund: false,
        startReleasing: true,
      })
      const insufficientPrinciple = releaseGoldDefaultSchedule.amountReleasedPerPeriod
        .multipliedBy(releaseGoldDefaultSchedule.numReleasePeriods)
        .minus(1)
      await goldTokenInstance.transfer(releaseGoldInstance.address, insufficientPrinciple, {
        from: owner,
      })
      const isFunded = await releaseGoldInstance.isFunded()
      assert.isTrue(isFunded)
    })
  })

  describe('#transfer', () => {
    const receiver = accounts[5]
    const transferAmount = 10

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      await mockStableToken.mint(releaseGoldInstance.address, transferAmount)
    })

    it('should transfer stable token from the release gold instance', async () => {
      await releaseGoldInstance.transfer(receiver, transferAmount, { from: beneficiary })
      const contractBalance = await mockStableToken.balanceOf(releaseGoldInstance.address)
      const recipientBalance = await mockStableToken.balanceOf(receiver)
      assertEqualBN(contractBalance, 0)
      assertEqualBN(recipientBalance, transferAmount)
    })
  })

  describe('#genericTransfer', () => {
    const receiver = accounts[5]
    const transferAmount = 10

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      await mockStableToken.mint(releaseGoldInstance.address, transferAmount)
    })

    it('should transfer stable token from the release gold instance', async () => {
      const startBalanceFrom = await mockStableToken.balanceOf(releaseGoldInstance.address)
      const startBalanceTo = await mockStableToken.balanceOf(receiver)
      await releaseGoldInstance.genericTransfer(mockStableToken.address, receiver, transferAmount, {
        from: beneficiary,
      })
      const endBalanceFrom = await mockStableToken.balanceOf(releaseGoldInstance.address)
      const endBalanceTo = await mockStableToken.balanceOf(receiver)
      assertEqualBN(endBalanceFrom, startBalanceFrom.minus(transferAmount))
      assertEqualBN(endBalanceTo, startBalanceTo.plus(transferAmount))
    })

    it('should emit safeTransfer logs on erc20 revert', async () => {
      const startBalanceFrom = await mockStableToken.balanceOf(releaseGoldInstance.address)
      await assertTransactionRevertWithReason(
        releaseGoldInstance.genericTransfer(
          mockStableToken.address,
          receiver,
          startBalanceFrom.plus(1),
          {
            from: beneficiary,
          }
        ),
        'SafeERC20: ERC20 operation did not succeed'
      )
    })

    it('should revert when attempting transfer of goldtoken from the release gold instance', async () => {
      await assertTransactionRevertWithReason(
        releaseGoldInstance.genericTransfer(goldTokenInstance.address, receiver, transferAmount, {
          from: beneficiary,
        }),
        'Transfer must not target celo balance'
      )
    })
  })

  describe('#creation', () => {
    describe('when an instance is properly created', () => {
      beforeEach(async () => {
        await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
        const { numReleasePeriods } =
          (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
        assertEqualBN(numReleasePeriods, releaseGoldDefaultSchedule.numReleasePeriods)
      })

      it('should set releaseGold amount per period to releaseGold instance', async () => {
        const { amountReleasedPerPeriod } =
          (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
        assertEqualBN(amountReleasedPerPeriod, releaseGoldDefaultSchedule.amountReleasedPerPeriod)
      })

      it('should set releaseGold period to releaseGold instance', async () => {
        const { releasePeriod } =
          (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
        assertEqualBN(releasePeriod, releaseGoldDefaultSchedule.releasePeriod)
      })

      it('should set releaseGold start time to releaseGold instance', async () => {
        const { releaseStartTime } =
          (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
        assertEqualBN(releaseStartTime, releaseGoldDefaultSchedule.releaseStartTime)
      })

      it('should set releaseGold cliff to releaseGold instance', async () => {
        const { releaseCliff } =
          (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
        const releaseGoldCliffStartTimeComputed = new BigNumber(
          releaseGoldDefaultSchedule.releaseStartTime
        ).plus(releaseGoldDefaultSchedule.releaseCliffTime)
        assertEqualBN(releaseCliff, releaseGoldCliffStartTimeComputed)
      })

      it('should set revocable flag to releaseGold instance', async () => {
        const revocationInfo = await releaseGoldInstance.revocationInfo()
        assert.equal(revocationInfo[0], releaseGoldDefaultSchedule.revocable)
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
        const { revokeTime } =
          (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
        assertEqualBN(revokeTime, 0)
      })

      it('should have releaseGoldBalanceAtRevoke on init equal to zero', async () => {
        const { releasedBalanceAtRevoke } =
          (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
        assertEqualBN(releasedBalanceAtRevoke, 0)
      })

      it('should revert when releaseGold beneficiary is the null address', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.beneficiary = NULL_ADDRESS
        await assertTransactionRevertWithReason(
          createNewReleaseGoldInstance(releaseGoldSchedule, web3),
          'The release schedule beneficiary cannot be the zero addresss'
        )
      })

      it('should revert when releaseGold periods are zero', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.numReleasePeriods = 0
        await assertTransactionRevertWithReason(
          createNewReleaseGoldInstance(releaseGoldSchedule, web3),
          'There must be at least one releasing period'
        )
      })

      it('should revert when released amount per period is zero', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.amountReleasedPerPeriod = new BigNumber('0')
        await assertTransactionRevertWithReason(
          createNewReleaseGoldInstance(releaseGoldSchedule, web3),
          'The released amount per period must be greater than zero'
        )
      })

      it('should overflow for very large combinations of release periods and amount per time', async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.numReleasePeriods = Number.MAX_SAFE_INTEGER
        releaseGoldSchedule.amountReleasedPerPeriod = new BigNumber(2).pow(300)
        await assertTransactionRevertWithReason(
          createNewReleaseGoldInstance(releaseGoldSchedule, web3),
          'value out-of-bounds'
        )
      })
    })
  })

  describe('#setBeneficiary', () => {
    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
    })

    it('should set a new beneficiary as the old beneficiary', async () => {
      await releaseGoldInstance.setBeneficiary(newBeneficiary, { from: owner })
      const actualBeneficiary = await releaseGoldInstance.beneficiary()
      assertSameAddress(actualBeneficiary, newBeneficiary)
    })

    it('should revert when setting a new beneficiary from the release owner', async () => {
      await assertTransactionRevertWithReason(
        releaseGoldInstance.setBeneficiary(newBeneficiary, { from: releaseOwner }),
        'Ownable: caller is not the owner'
      )
    })

    it('should emit the BeneficiarySet event', async () => {
      const setNewBeneficiaryTx = await releaseGoldInstance.setBeneficiary(newBeneficiary, {
        from: owner,
      })
      assertLogMatches(setNewBeneficiaryTx.logs[0], 'BeneficiarySet', {
        beneficiary: newBeneficiary,
      })
    })
  })

  describe('#createAccount', () => {
    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
        await assertTransactionRevertWithReason(
          releaseGoldInstance.createAccount({ from: accounts[2] }),
          'Sender must be the beneficiary and state must not be revoked'
        )
      })
    })

    describe('when revoked', () => {
      beforeEach(async () => {
        await releaseGoldInstance.revoke({ from: releaseOwner })
      })

      it('reverts if anyone attempts account creation', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertTransactionRevertWithReason(
          releaseGoldInstance.createAccount({ from: beneficiary }),
          'Sender must be the beneficiary and state must not be revoked'
        )
      })
    })
  })

  describe('#setAccount', () => {
    const accountName = 'name'
    const dataEncryptionKey: any =
      '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      proofOfWalletOwnership = await getParsedSignatureOfAddress(
        web3,
        releaseGoldInstance.address,
        beneficiary
      )
    })

    describe('when unrevoked', () => {
      it('sets the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await releaseGoldInstance.setAccount(
          accountName,
          dataEncryptionKey,
          walletAddress,
          proofOfWalletOwnership.v,
          proofOfWalletOwnership.r,
          proofOfWalletOwnership.s,
          {
            from: beneficiary,
          }
        )
        isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isTrue(isAccount)
      })

      it('reverts if a non-beneficiary attempts to set the account', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccount(
            accountName,
            dataEncryptionKey,
            walletAddress,
            proofOfWalletOwnership.v,
            proofOfWalletOwnership.r,
            proofOfWalletOwnership.s,
            {
              from: accounts[2],
            }
          ),
          'Sender must be the beneficiary and state must not be revoked'
        )
      })

      it('should set the name, dataEncryptionKey and walletAddress of the account by beneficiary', async () => {
        let isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await releaseGoldInstance.setAccount(
          accountName,
          dataEncryptionKey,
          walletAddress,
          proofOfWalletOwnership.v,
          proofOfWalletOwnership.r,
          proofOfWalletOwnership.s,
          {
            from: beneficiary,
          }
        )
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
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccount(
            accountName,
            dataEncryptionKey,
            walletAddress,
            proofOfWalletOwnership.v,
            proofOfWalletOwnership.r,
            proofOfWalletOwnership.s,
            {
              from: releaseOwner,
            }
          ),
          'Sender must be the beneficiary and state must not be revoked'
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
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccount(
            accountName,
            dataEncryptionKey,
            walletAddress,
            proofOfWalletOwnership.v,
            proofOfWalletOwnership.r,
            proofOfWalletOwnership.s,
            {
              from: releaseOwner,
            }
          ),
          'Sender must be the beneficiary and state must not be revoked'
        )
      })

      it('should revert to set the name, dataEncryptionKey and walletAddress of the account', async () => {
        const isAccount = await accountsInstance.isAccount(releaseGoldInstance.address)
        assert.isFalse(isAccount)
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccount(
            accountName,
            dataEncryptionKey,
            walletAddress,
            proofOfWalletOwnership.v,
            proofOfWalletOwnership.r,
            proofOfWalletOwnership.s,
            {
              from: releaseOwner,
            }
          ),
          'Sender must be the beneficiary and state must not be revoked'
        )
      })
    })
  })

  describe('#setAccountName', () => {
    const accountName = 'name'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
    })

    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccountName(accountName, { from: beneficiary }),
          'Register with createAccount to set account name'
        )
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
          await assertTransactionRevertWithReason(
            releaseGoldInstance.setAccountName(accountName, { from: accounts[2] }),
            'Sender must be the beneficiary and state must not be revoked'
          )
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await releaseGoldInstance.revoke({ from: releaseOwner })
        })

        it('should revert if anyone attempts to set the name', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.setAccountName(accountName, { from: releaseOwner }),
            'Sender must be the beneficiary and state must not be revoked'
          )
        })
      })
    })
  })

  describe('#setAccountWalletAddress', () => {
    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      proofOfWalletOwnership = await getParsedSignatureOfAddress(
        web3,
        releaseGoldInstance.address,
        beneficiary
      )
    })

    describe('when the releaseGold account has not been created', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccountWalletAddress(
            walletAddress,
            proofOfWalletOwnership.v,
            proofOfWalletOwnership.r,
            proofOfWalletOwnership.s,
            { from: beneficiary }
          ),
          'Unknown account'
        )
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await releaseGoldInstance.createAccount({ from: beneficiary })
      })

      describe('when unrevoked', () => {
        it('beneficiary should set the walletAddress', async () => {
          await releaseGoldInstance.setAccountWalletAddress(
            walletAddress,
            proofOfWalletOwnership.v,
            proofOfWalletOwnership.r,
            proofOfWalletOwnership.s,
            { from: beneficiary }
          )
          const result = await accountsInstance.getWalletAddress(releaseGoldInstance.address)
          assert.equal(result, walletAddress)
        })

        it('should revert if non-beneficiary attempts to set the walletAddress', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.setAccountWalletAddress(
              walletAddress,
              proofOfWalletOwnership.v,
              proofOfWalletOwnership.r,
              proofOfWalletOwnership.s,
              { from: accounts[2] }
            ),
            'Sender must be the beneficiary and state must not be revoked'
          )
        })

        it('beneficiary should set the NULL_ADDRESS', async () => {
          await releaseGoldInstance.setAccountWalletAddress(NULL_ADDRESS, '0x0', '0x0', '0x0', {
            from: beneficiary,
          })
          const result = await accountsInstance.getWalletAddress(releaseGoldInstance.address)
          assert.equal(result, NULL_ADDRESS)
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await releaseGoldInstance.revoke({ from: releaseOwner })
        })

        it('should revert if anyone attempts to set the walletAddress', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.setAccountWalletAddress(
              walletAddress,
              proofOfWalletOwnership.v,
              proofOfWalletOwnership.r,
              proofOfWalletOwnership.s,
              { from: releaseOwner }
            ),
            'Sender must be the beneficiary and state must not be revoked'
          )
        })
      })
    })
  })

  describe('#setAccountMetadataURL', () => {
    const metadataURL = 'meta'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
    })

    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: beneficiary }),
          'Unknown account'
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
          await assertTransactionRevertWithReason(
            releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: accounts[2] }),
            'Sender must be the beneficiary and state must not be revoked'
          )
        })
      })

      describe('when revoked', () => {
        beforeEach(async () => {
          await releaseGoldInstance.revoke({ from: releaseOwner })
        })

        it('should revert if anyone attempts to set the metadataURL', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.setAccountMetadataURL(metadataURL, { from: releaseOwner }),
            'Sender must be the beneficiary and state must not be revoked'
          )
        })
      })
    })
  })

  describe('#setAccountDataEncryptionKey', () => {
    const dataEncryptionKey: any =
      '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
    const longDataEncryptionKey: any =
      '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
      '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
      await assertTransactionRevertWithReason(
        releaseGoldInstance.setAccountDataEncryptionKey(dataEncryptionKey, { from: accounts[2] }),
        'Sender must be the beneficiary and state must not be revoked'
      )
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros: any =
        '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      await releaseGoldInstance.setAccountDataEncryptionKey(keyWithZeros, { from: beneficiary })
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(
        releaseGoldInstance.address
      )
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      const invalidKey: any = '0x32132931293'
      await assertTransactionRevertWithReason(
        releaseGoldInstance.setAccountDataEncryptionKey(invalidKey, { from: beneficiary }),
        'data encryption key length <= 32'
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
    beforeEach(async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.initialDistributionRatio = 0
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
    })

    describe('when the max distribution is set to 50%', () => {
      beforeEach(async () => {
        await releaseGoldInstance.setMaxDistribution(500, { from: releaseOwner })
      })

      it('should set max distribution to 5 gold', async () => {
        const maxDistribution = await releaseGoldInstance.maxDistribution()
        assertEqualBN(maxDistribution, TOTAL_AMOUNT.div(2))
      })
    })

    describe('when the max distribution is set to 100%', () => {
      beforeEach(async () => {
        await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
      })

      it('should set max distribution to max uint256', async () => {
        const maxDistribution = await releaseGoldInstance.maxDistribution()
        assertGteBN(maxDistribution, TOTAL_AMOUNT)
      })

      it('cannot be lowered again', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.setMaxDistribution(500, { from: releaseOwner }),
          'Cannot set max distribution lower if already set to 1000'
        )
      })
    })
  })
  type Key = keyof typeof authorizationTestDescriptions

  describe('authorization tests:', () => {
    Object.keys(authorizationTestDescriptions).forEach((key0) => {
      const key: Key = key0 as unknown as Key
      let authorizationTest: any
      const authorized = accounts[4] // the account that is to be authorized for whatever role
      let sig: any

      describe(`#authorize${_.upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
        beforeEach(async () => {
          const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
          releaseGoldSchedule.revocable = false
          releaseGoldSchedule.refundAddress = '0x0000000000000000000000000000000000000000'
          releaseGoldSchedule.canValidate = true
          await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
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

        // The attestations signer does not send txs.
        if (authorizationTestDescriptions[key].subject !== 'attestationSigner') {
          it(`should transfer 1 CELO to the ${authorizationTestDescriptions[key].me}`, async () => {
            const balance1 = await web3.eth.getBalance(authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
            const balance2 = await web3.eth.getBalance(authorized)
            assertEqualBN(new BigNumber(balance2).minus(balance1), web3.utils.toWei('1'))
          })
        } else {
          it(`should not transfer 1 CELO to the ${authorizationTestDescriptions[key].me}`, async () => {
            const balance1 = await web3.eth.getBalance(authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
            const balance2 = await web3.eth.getBalance(authorized)
            assertEqualBN(new BigNumber(balance2).minus(balance1), 0)
          })
        }

        it(`should revert if the ${authorizationTestDescriptions[key].me} is an account`, async () => {
          await accountsInstance.createAccount({ from: authorized })
          await assertTransactionRevertWithReason(
            authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary }),
            'Cannot re-authorize address or locked gold account for another account'
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
          await assertTransactionRevertWithReason(
            authorizationTest.fn(otherAccount, otherSig.v, otherSig.r, otherSig.s, {
              from: beneficiary,
            }),
            'Cannot re-authorize address or locked gold account for another account'
          )
        })

        it('should revert if the signature is incorrect', async () => {
          const nonVoter = accounts[5]
          const incorrectSig = await getParsedSignatureOfAddress(
            web3,
            releaseGoldInstance.address,
            nonVoter
          )
          await assertTransactionRevertWithReason(
            authorizationTest.fn(authorized, incorrectSig.v, incorrectSig.r, incorrectSig.s, {
              from: beneficiary,
            }),
            'Invalid signature'
          )
        })

        describe('when a previous authorization has been made', () => {
          const newAuthorized = accounts[6]
          let balance1: string
          let newSig: any
          beforeEach(async () => {
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s, { from: beneficiary })
            newSig = await getParsedSignatureOfAddress(
              web3,
              releaseGoldInstance.address,
              newAuthorized
            )
            balance1 = await web3.eth.getBalance(newAuthorized)
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

          it(`should not transfer 1 CELO to the ${authorizationTestDescriptions[key].me}`, async () => {
            const balance2 = await web3.eth.getBalance(newAuthorized)
            assertEqualBN(new BigNumber(balance2).minus(balance1), 0)
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

  describe('#authorizeWithPublicKeys', () => {
    const authorized = accounts[4] // the account that is to be authorized for whatever role

    describe('with ECDSA public key', () => {
      beforeEach(async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.revocable = false
        releaseGoldSchedule.canValidate = true
        releaseGoldSchedule.refundAddress = NULL_ADDRESS
        await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
        await releaseGoldInstance.createAccount({ from: beneficiary })
        const ecdsaPublicKey = await addressToPublicKey(authorized, web3.eth.sign)
        const sig = await getParsedSignatureOfAddress(web3, releaseGoldInstance.address, authorized)
        await releaseGoldInstance.authorizeValidatorSignerWithPublicKey(
          authorized,
          sig.v,
          sig.r,
          sig.s,
          ecdsaPublicKey as any,
          { from: beneficiary }
        )
      })

      it('should set the authorized keys', async () => {
        assert.equal(await accountsInstance.authorizedBy(authorized), releaseGoldInstance.address)
        assert.equal(
          await accountsInstance.getValidatorSigner(releaseGoldInstance.address),
          authorized
        )
        assert.equal(
          await accountsInstance.validatorSignerToAccount(authorized),
          releaseGoldInstance.address
        )
      })
    })

    describe('with bls keys', () => {
      beforeEach(async () => {
        const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
        releaseGoldSchedule.revocable = false
        releaseGoldSchedule.canValidate = true
        releaseGoldSchedule.refundAddress = NULL_ADDRESS
        await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
        await releaseGoldInstance.createAccount({ from: beneficiary })
        const ecdsaPublicKey = await addressToPublicKey(authorized, web3.eth.sign)
        const newBlsPublicKey = web3.utils.randomHex(96)
        const newBlsPoP = web3.utils.randomHex(48)

        const sig = await getParsedSignatureOfAddress(web3, releaseGoldInstance.address, authorized)
        await releaseGoldInstance.authorizeValidatorSignerWithKeys(
          authorized,
          sig.v,
          sig.r,
          sig.s,
          ecdsaPublicKey as any,
          newBlsPublicKey,
          newBlsPoP,
          { from: beneficiary }
        )
      })

      it('should set the authorized keys', async () => {
        assert.equal(await accountsInstance.authorizedBy(authorized), releaseGoldInstance.address)
        assert.equal(
          await accountsInstance.getValidatorSigner(releaseGoldInstance.address),
          authorized
        )
        assert.equal(
          await accountsInstance.validatorSignerToAccount(authorized),
          releaseGoldInstance.address
        )
      })
    })
  })

  describe('#revoke', () => {
    it('releaseOwner should be able to revoke the releaseGold', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      const releaseOwnereleaseGoldTx = await releaseGoldInstance.revoke({ from: releaseOwner })
      const revokeBlockTimestamp = await getCurrentBlockchainTimestamp(web3)
      const { revokeTime } =
        (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
      assertEqualBN(revokeBlockTimestamp, revokeTime)
      assert.isTrue(await releaseGoldInstance.isRevoked())
      assertLogMatches(releaseOwnereleaseGoldTx.logs[0], 'ReleaseScheduleRevoked', {
        revokeTimestamp: revokeBlockTimestamp,
        releasedBalanceAtRevoke: await releaseGoldInstance.getCurrentReleasedTotalAmount(),
      })
    })

    it('should revert when non-releaseOwner attempts to revoke the releaseGold', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      await assertTransactionRevertWithReason(
        releaseGoldInstance.revoke({ from: accounts[5] }),
        'Sender must be the registered releaseOwner address'
      )
    })

    it('should revert if releaseGold is already revoked', async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      await releaseGoldInstance.revoke({ from: releaseOwner })
      await assertTransactionRevertWithReason(
        releaseGoldInstance.revoke({ from: releaseOwner }),
        'Release schedule instance must not already be revoked'
      )
    })

    it('should revert if releaseGold is non-revocable', async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.revocable = false
      releaseGoldSchedule.refundAddress = '0x0000000000000000000000000000000000000000'
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
      await assertTransactionRevertWithReason(
        releaseGoldInstance.revoke({ from: releaseOwner }),
        'Release schedule instance must be revocable'
      )
    })
  })

  describe('#expire', () => {
    describe('when the contract is expirable', () => {
      beforeEach(async () => {
        await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      })

      describe('when called before expiration time has passed', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.expire({ from: releaseOwner }),
            '`EXPIRATION_TIME` must have passed after the end of releasing'
          )
        })
      })

      describe('when the contract has finished releasing', () => {
        beforeEach(async () => {
          const { releasePeriod, numReleasePeriods } =
            (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
          const grantTime = numReleasePeriods
            .times(releasePeriod)
            .plus(5 * MINUTE)
            .toNumber()
          await timeTravel(grantTime, web3)
        })

        it('should revert before `EXPIRATION_TIME` after release schedule end', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.expire({ from: releaseOwner }),
            '`EXPIRATION_TIME` must have passed after the end of releasing'
          )
        })

        describe('when `EXPIRATION_TIME` has passed after release schedule completion', () => {
          beforeEach(async () => {
            const expirationTime = await releaseGoldInstance.EXPIRATION_TIME()
            const timeToTravel = expirationTime.toNumber()
            await timeTravel(timeToTravel, web3)
          })
          describe('when not called by releaseOwner', () => {
            it('should revert', async () => {
              await assertTransactionRevertWithReason(
                releaseGoldInstance.expire(),
                'Sender must be the registered releaseOwner address'
              )
            })
          })

          describe('when called by releaseOwner', () => {
            it('should succeed', async () => {
              await releaseGoldInstance.expire({ from: releaseOwner })
            })
          })

          describe('when an instance is expired', () => {
            describe('when the beneficiary has not withdrawn any balance yet', () => {
              beforeEach(async () => {
                await releaseGoldInstance.expire({ from: releaseOwner })
              })

              it('should revoke the contract', async () => {
                const isRevoked = await releaseGoldInstance.isRevoked()
                assert.equal(isRevoked, true)
              })

              it('should set the released balance at revocation to total withdrawn', async () => {
                const { releasedBalanceAtRevoke } =
                  (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
                // 0 gold withdrawn at this point
                assertEqualBN(releasedBalanceAtRevoke, 0)
              })

              it('should allow refund of all remaining gold', async () => {
                const refundAddressBalanceBefore = await goldTokenInstance.balanceOf(refundAddress)
                await releaseGoldInstance.refundAndFinalize({ from: releaseOwner })
                const refundAddressBalanceAfter = await goldTokenInstance.balanceOf(refundAddress)
                assertEqualBN(
                  refundAddressBalanceAfter.minus(refundAddressBalanceBefore),
                  TOTAL_AMOUNT
                )
              })
            })

            describe('when the beneficiary has withdrawn some balance', () => {
              beforeEach(async () => {
                await releaseGoldInstance.withdraw(TOTAL_AMOUNT.div(2), { from: beneficiary })
                await releaseGoldInstance.expire({ from: releaseOwner })
              })

              it('should revoke the contract', async () => {
                const isRevoked = await releaseGoldInstance.isRevoked()
                assert.equal(isRevoked, true)
              })

              it('should set the released balance at revocation to total withdrawn', async () => {
                const { releasedBalanceAtRevoke } =
                  (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
                // half of gold withdrawn at this point
                assertEqualBN(releasedBalanceAtRevoke, TOTAL_AMOUNT.div(2))
              })

              it('should allow refund of all remaining gold', async () => {
                const refundAddressBalanceBefore = await goldTokenInstance.balanceOf(refundAddress)
                await releaseGoldInstance.refundAndFinalize({ from: releaseOwner })
                const refundAddressBalanceAfter = await goldTokenInstance.balanceOf(refundAddress)
                assertEqualBN(
                  refundAddressBalanceAfter.minus(refundAddressBalanceBefore),
                  TOTAL_AMOUNT.div(2)
                )
              })
            })
          })
        })
      })
    })

    describe('when the contract is not expirable', () => {
      beforeEach(async () => {
        await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
        await releaseGoldInstance.setCanExpire(false, { from: beneficiary })
        const { numReleasePeriods, releasePeriod } =
          (await releaseGoldInstance.releaseSchedule()) as unknown as ReleaseSchedule
        const expirationTime = await releaseGoldInstance.EXPIRATION_TIME()
        const grantTime = numReleasePeriods.times(releasePeriod).plus(5 * MINUTE)
        const timeToTravel = grantTime.plus(expirationTime).toNumber()
        await timeTravel(timeToTravel, web3)
      })

      describe('when `expire` is called', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.expire({ from: releaseOwner }),
            'Contract must be expirable'
          )
        })
      })
    })
  })

  describe('#refundAndFinalize', () => {
    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
      await assertTransactionRevertWithReason(
        releaseGoldInstance.refundAndFinalize({ from: accounts[5] }),
        'Sender must be the releaseOwner and state must be revoked'
      )
    })

    it('should revert when non-revoked but called by a releaseOwner', async () => {
      await assertTransactionRevertWithReason(
        releaseGoldInstance.refundAndFinalize({ from: releaseOwner }),
        'Sender must be the releaseOwner and state must be revoked'
      )
    })

    describe('when revoked()', () => {
      beforeEach(async () => {
        await releaseGoldInstance.revoke({ from: releaseOwner })
      })

      it('should transfer gold proportions to both beneficiary and refundAddress when no gold locked', async () => {
        const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
        const refundAddressBalanceBefore = await goldTokenInstance.balanceOf(refundAddress)
        const { releasedBalanceAtRevoke } =
          (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
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
    let lockAmount: BigNumber = new BigNumber(0)

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
      await assertTransactionRevertWithReason(
        releaseGoldInstance.lockGold(lockAmount, {
          from: beneficiary,
        }),
        'Must first register address with Account.createAccount'
      )
    })

    it('should revert if beneficiary tries to lock up more than there is remaining in the contract', async () => {
      await releaseGoldInstance.createAccount({ from: beneficiary })
      await assertTransactionRevertWithoutReason(
        releaseGoldInstance.lockGold(lockAmount.multipliedBy(1.1), {
          from: beneficiary,
        })
      )
    })

    it('should revert if non-beneficiary tries to lock up any unlocked amount', async () => {
      await releaseGoldInstance.createAccount({ from: beneficiary })
      await assertTransactionRevertWithReason(
        releaseGoldInstance.lockGold(lockAmount, { from: accounts[6] }),
        'Sender must be the beneficiary and state must not be revoked'
      )
    })
  })

  describe('#unlockGold', () => {
    let lockAmount: BigNumber = new BigNumber(0)

    beforeEach(async () => {
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
      // beneficiary shall make the released gold instance an account
      await releaseGoldInstance.createAccount({ from: beneficiary })
      lockAmount = releaseGoldDefaultSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldDefaultSchedule.numReleasePeriods
      )
    })

    it('beneficiary should unlock his locked gold and add a pending withdrawal', async () => {
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      await releaseGoldInstance.unlockGold(lockAmount, {
        from: beneficiary,
      })

      const data = await lockedGoldInstance.getPendingWithdrawals(releaseGoldInstance.address)
      const values = data[0]
      const timestamps = data[1]
      assert.equal(values.length, 1)
      assert.equal(timestamps.length, 1)
      assertEqualBN(values[0], lockAmount)
      assertEqualBN(timestamps[0], (await getCurrentBlockchainTimestamp(web3)) + UNLOCKING_PERIOD)

      assertEqualBN(
        await lockedGoldInstance.getAccountTotalLockedGold(releaseGoldInstance.address),
        0
      )
      // ReleaseGold locked balance should still reflect pending withdrawals
      assertEqualBN(await releaseGoldInstance.getRemainingLockedBalance(), lockAmount)
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
      await assertTransactionRevertWithReason(
        releaseGoldInstance.unlockGold(lockAmount, { from: accounts[5] }),
        'Must be called by releaseOwner when revoked or beneficiary before revocation'
      )
    })

    it('should revert if beneficiary in voting tries to unlock the locked amount', async () => {
      // set the contract in voting
      await mockGovernance.setVoting(releaseGoldInstance.address)
      // lock the entire releaseGold amount
      await releaseGoldInstance.lockGold(lockAmount, {
        from: beneficiary,
      })
      // unlock the latter
      await assertTransactionRevertWithReason(
        releaseGoldInstance.unlockGold(lockAmount, { from: accounts[5] }),
        'Must be called by releaseOwner when revoked or beneficiary before revocation'
      )
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
      await assertTransactionRevertWithReason(
        releaseGoldInstance.unlockGold(lockAmount, { from: beneficiary }),
        "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
      )
    })
  })

  describe('#withdrawLockedGold', () => {
    const value = 1000
    const index = 0

    describe('when a pending withdrawal exists', () => {
      beforeEach(async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
          const data = await lockedGoldInstance.getPendingWithdrawals(releaseGoldInstance.address)
          const values = data[0]
          const timestamps = data[1]
          assert.equal(values.length, 0)
          assert.equal(timestamps.length, 0)
          assertEqualBN(await releaseGoldInstance.getRemainingLockedBalance(), 0)
        })
      })

      describe('when it is before the availablity time', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.withdrawLockedGold(index, { from: beneficiary }),
            'Pending withdrawal not available'
          )
        })
      })

      describe('when non-beneficiary attempts to withdraw the gold', () => {
        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.withdrawLockedGold(index, { from: accounts[4] }),
            'Must be called by releaseOwner when revoked or beneficiary before revocation'
          )
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.withdrawLockedGold(index, { from: beneficiary }),
          'Pending withdrawal not available'
        )
      })
    })
  })

  describe('#relockGold', () => {
    const pendingWithdrawalValue = 1000
    const index = 0

    beforeEach(async () => {
      // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
      await createNewReleaseGoldInstance(releaseGoldDefaultSchedule, web3)
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
          const data = await lockedGoldInstance.getPendingWithdrawals(releaseGoldInstance.address)
          const values = data[0]
          const timestamps = data[1]
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
          await assertTransactionRevertWithReason(
            releaseGoldInstance.relockGold(index, value, { from: beneficiary }),
            'Requested value larger than pending value'
          )
        })
      })
    })

    describe('when a pending withdrawal does not exist', () => {
      it('should revert', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.relockGold(index, pendingWithdrawalValue),
          'Sender must be the beneficiary and state must not be revoked'
        )
      })
    })
  })

  describe('#withdraw', () => {
    let initialreleaseGoldAmount: any

    beforeEach(async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.releaseStartTime = Math.round(Date.now() / 1000)
      releaseGoldSchedule.initialDistributionRatio = 0
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
      initialreleaseGoldAmount = releaseGoldSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldSchedule.numReleasePeriods
      )
    })

    it('should revert before the release cliff has passed', async () => {
      await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
      const timeToTravel = 0.5 * HOUR
      await timeTravel(timeToTravel, web3)
      await assertTransactionRevertWithReason(
        releaseGoldInstance.withdraw(initialreleaseGoldAmount.div(20), { from: beneficiary }),
        'Requested amount is greater than available released funds'
      )
    })

    it('should revert when withdrawable amount is zero', async () => {
      await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
      const timeToTravel = 3 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      await assertTransactionRevertWithReason(
        releaseGoldInstance.withdraw(new BigNumber(0), { from: beneficiary }),
        'Requested withdrawal amount must be greater than zero'
      )
    })

    describe('when not revoked', () => {
      describe('when max distribution is 100%', () => {
        beforeEach(async () => {
          await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
        })
        it('should revert since beneficiary should not be able to withdraw anything within the first quarter', async () => {
          const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
          const timeToTravel = 2.9 * MONTH
          await timeTravel(timeToTravel, web3)
          const expectedWithdrawalAmount = await releaseGoldInstance.getCurrentReleasedTotalAmount()
          const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
          assertEqualBN(expectedWithdrawalAmount, 0)
          await assertTransactionRevertWithReason(
            releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary }),
            'Requested withdrawal amount must be greater than zero'
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
          expectBigNumberInRange(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
          expectBigNumberInRange(
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
          expectBigNumberInRange(
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
          expectBigNumberInRange(
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

          expectBigNumberInRange(
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
          beforeEach(async () => {
            // Simulate rewards of 0.5 Gold
            await goldTokenInstance.transfer(releaseGoldInstance.address, ONE_GOLDTOKEN.div(2), {
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
              const expectedWithdrawalAmount = TOTAL_AMOUNT.plus(ONE_GOLDTOKEN.div(2))
              await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
            })
          })

          describe('when the grant is only halfway released', () => {
            beforeEach(async () => {
              const timeToTravel = 6 * MONTH + 1 * DAY
              await timeTravel(timeToTravel, web3)
            })

            it('should scale released amount to 50% of initial balance plus rewards', async () => {
              const expectedWithdrawalAmount = TOTAL_AMOUNT.plus(ONE_GOLDTOKEN.div(2)).div(2)
              await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
            })

            it('should not allow withdrawal of more than 50% gold', async () => {
              const unexpectedWithdrawalAmount = TOTAL_AMOUNT.plus(ONE_GOLDTOKEN).div(2).plus(1)
              await assertTransactionRevertWithReason(
                releaseGoldInstance.withdraw(unexpectedWithdrawalAmount, { from: beneficiary }),
                'Requested amount is greater than available released funds'
              )
            })
          })
        })
      })

      // Max distribution should set a static value of `ratio` of total funds at call time of `setMaxDistribution`
      // So this is testing that the maxDistribution is unrelated to rewards, except the 100% special case.
      describe('when max distribution is 50% and all gold is released', () => {
        beforeEach(async () => {
          await releaseGoldInstance.setMaxDistribution(500, { from: releaseOwner })
          // Simulate rewards of 0.5 Gold
          // Have to send after setting max distribution as mentioned above
          await goldTokenInstance.transfer(releaseGoldInstance.address, ONE_GOLDTOKEN.div(2), {
            from: owner,
          })
          const timeToTravel = 12 * MONTH + 1 * DAY
          await timeTravel(timeToTravel, web3)
        })

        it('should only allow withdrawal of 50% of initial grant (not including rewards)', async () => {
          const expectedWithdrawalAmount = TOTAL_AMOUNT.div(2)
          await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
          const unexpectedWithdrawalAmount = 1
          await assertTransactionRevertWithReason(
            releaseGoldInstance.withdraw(unexpectedWithdrawalAmount, { from: beneficiary }),
            'Requested amount exceeds current alloted maximum distribution'
          )
        })
      })
    })

    describe('when revoked', () => {
      describe('when max distribution is 100%', () => {
        beforeEach(async () => {
          await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
        })
        it('should allow the beneficiary to withdraw up to the releasedBalanceAtRevoke', async () => {
          const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
          const timeToTravel = 6 * MONTH + 1 * DAY
          await timeTravel(timeToTravel, web3)
          await releaseGoldInstance.revoke({ from: releaseOwner })
          const info = (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
          const expectedWithdrawalAmount = info[2]
          await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
          const totalWithdrawn = await releaseGoldInstance.totalWithdrawn()
          const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)
          expectBigNumberInRange(new BigNumber(totalWithdrawn), expectedWithdrawalAmount)
          expectBigNumberInRange(
            new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
            expectedWithdrawalAmount
          )
        })

        it('should revert if beneficiary attempts to withdraw more than releasedBalanceAtRevoke', async () => {
          const timeToTravel = 6 * MONTH + 1 * DAY
          await timeTravel(timeToTravel, web3)
          await releaseGoldInstance.revoke({ from: releaseOwner })
          const { releasedBalanceAtRevoke } =
            (await releaseGoldInstance.revocationInfo()) as unknown as RevocationInfo
          await assertTransactionRevertWithReason(
            releaseGoldInstance.withdraw(new BigNumber(releasedBalanceAtRevoke).multipliedBy(1.1), {
              from: beneficiary,
            }),
            'Requested amount is greater than available released funds'
          )
        })

        it('should selfdestruct if beneficiary withdraws the entire amount', async () => {
          const beneficiaryBalanceBefore = await goldTokenInstance.balanceOf(beneficiary)
          const timeToTravel = 12 * MONTH + 1 * DAY
          await timeTravel(timeToTravel, web3)
          await releaseGoldInstance.revoke({ from: releaseOwner })
          const [, , expectedWithdrawalAmount] = await releaseGoldInstance.revocationInfo()
          await releaseGoldInstance.withdraw(expectedWithdrawalAmount, { from: beneficiary })
          const beneficiaryBalanceAfter = await goldTokenInstance.balanceOf(beneficiary)

          expectBigNumberInRange(
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
    })

    describe('when max distribution is set lower', () => {
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

          expectBigNumberInRange(
            new BigNumber(beneficiaryBalanceAfter).minus(new BigNumber(beneficiaryBalanceBefore)),
            expectedWithdrawalAmount
          )
        })

        it('should revert on withdrawal of more than 50%', async () => {
          await assertTransactionRevertWithReason(
            releaseGoldInstance.withdraw(initialreleaseGoldAmount, { from: beneficiary }),
            'Requested amount exceeds current alloted maximum distribution'
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

          expectBigNumberInRange(
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
        const timeToTravel = 12 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
      })

      it('should revert on withdraw of any amount', async () => {
        await assertTransactionRevertWithReason(
          releaseGoldInstance.withdraw(initialreleaseGoldAmount.multipliedBy(0.5), {
            from: beneficiary,
          }),
          'Requested withdrawal before liquidity provision is met'
        )
        await assertTransactionRevertWithReason(
          releaseGoldInstance.withdraw(initialreleaseGoldAmount, { from: beneficiary }),
          'Requested withdrawal before liquidity provision is met'
        )
      })
    })
  })

  describe('#getCurrentReleasedTotalAmount', () => {
    let initialreleaseGoldAmount: any

    beforeEach(async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.releaseStartTime = Math.round(Date.now() / 1000)
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
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

  describe('#getWithdrawableAmount', () => {
    let initialReleaseGoldAmount: any

    beforeEach(async () => {
      const releaseGoldSchedule = _.clone(releaseGoldDefaultSchedule)
      releaseGoldSchedule.canValidate = true
      releaseGoldSchedule.revocable = false
      releaseGoldSchedule.refundAddress = '0x0000000000000000000000000000000000000000'
      releaseGoldSchedule.releaseStartTime = Math.round(Date.now() / 1000)
      releaseGoldSchedule.initialDistributionRatio = 500
      await createNewReleaseGoldInstance(releaseGoldSchedule, web3)
      initialReleaseGoldAmount = releaseGoldSchedule.amountReleasedPerPeriod.multipliedBy(
        releaseGoldSchedule.numReleasePeriods
      )

      await releaseGoldInstance.createAccount({ from: beneficiary })
    })

    describe('should return 50% of the released amount of gold right after the beginning of the second quarter', async () => {
      beforeEach(async () => {
        await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })

        const timeToTravel = 6 * MONTH + 1 * DAY
        await timeTravel(timeToTravel, web3)
      })

      it('should return the full amount available for this release period', async () => {
        const expectedWithdrawalAmount = initialReleaseGoldAmount.div(2)
        const withdrawableAmount = await releaseGoldInstance.getWithdrawableAmount()
        assertEqualBN(withdrawableAmount, expectedWithdrawalAmount)
      })

      it('should return only amount not yet withdrawn', async () => {
        const expectedWithdrawalAmount = initialReleaseGoldAmount.div(2)
        await releaseGoldInstance.withdraw(expectedWithdrawalAmount.div(2), { from: beneficiary })

        const afterWithdrawal = await releaseGoldInstance.getWithdrawableAmount()
        await releaseGoldInstance.getWithdrawableAmount()
        assertEqualBN(afterWithdrawal, expectedWithdrawalAmount.div(2))
      })
    })

    it('should return only up to its own balance', async () => {
      await releaseGoldInstance.setMaxDistribution(1000, { from: releaseOwner })
      const timeToTravel = 6 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const signerFund = new BigNumber('1000000000000000000')
      const expectedWithdrawalAmount = initialReleaseGoldAmount.minus(signerFund).div(2)

      const authorized = accounts[4]
      const ecdsaPublicKey = await addressToPublicKey(authorized, web3.eth.sign)
      const sig = await getParsedSignatureOfAddress(web3, releaseGoldInstance.address, authorized)
      // this will send 1 CELO from release gold balance to authorized
      await releaseGoldInstance.authorizeValidatorSignerWithPublicKey(
        authorized,
        sig.v,
        sig.r,
        sig.s,
        ecdsaPublicKey as any,
        { from: beneficiary }
      )

      const withdrawableAmount = await releaseGoldInstance.getWithdrawableAmount()
      assertEqualBN(withdrawableAmount, expectedWithdrawalAmount)
    })

    it('should return only up to max distribution', async () => {
      const timeToTravel = 6 * MONTH + 1 * DAY
      await timeTravel(timeToTravel, web3)
      const expectedWithdrawalAmount = initialReleaseGoldAmount.div(2)

      await releaseGoldInstance.setMaxDistribution(250, { from: releaseOwner })

      const withdrawableAmount = await releaseGoldInstance.getWithdrawableAmount()
      assertEqualBN(withdrawableAmount, expectedWithdrawalAmount.div(2))
    })
  })
})
