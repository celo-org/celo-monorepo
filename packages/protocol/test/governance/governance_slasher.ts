import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert, NULL_ADDRESS } from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  GovernanceSlasherContract,
  GovernanceSlasherInstance,
  MockElectionContract,
  MockElectionInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  RegistryContract,
  RegistryInstance,
  ValidatorsTestContract,
  ValidatorsTestInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const Validators: ValidatorsTestContract = artifacts.require('ValidatorsTest')
const GovernanceSlasher: GovernanceSlasherContract = artifacts.require('GovernanceSlasher')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
// const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Validators.numberFormat = 'BigNumber'
// @ts-ignore
GovernanceSlasher.numberFormat = 'BigNumber'

const HOUR = 60 * 60
const DAY = 24 * HOUR
// Hard coded in ganache.
// const EPOCH = 100

contract('GovernanceSlasher', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: ValidatorsTestInstance
  let registry: RegistryInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: GovernanceSlasherInstance
  const nonOwner = accounts[1]
  const validator = accounts[1]

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
  const slashingMultiplierResetPeriod = 30 * DAY
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

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockElection = await MockElection.new()
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    validators = await Validators.new()
    slasher = await GovernanceSlasher.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await registry.setAddressFor(CeloContractName.GovernanceSlasher, slasher.address)
    await validators.initialize(
      registry.address,
      groupLockedGoldRequirements.value,
      groupLockedGoldRequirements.duration,
      validatorLockedGoldRequirements.value,
      validatorLockedGoldRequirements.duration,
      validatorScoreParameters.exponent,
      validatorScoreParameters.adjustmentSpeed,
      membershipHistoryLength,
      slashingMultiplierResetPeriod,
      maxGroupSize
    )
    const group = accounts[0]
    await registerValidatorGroupWithMembers(group, [validator])
    await slasher.initialize(registry.address)
    await mockLockedGold.incrementNonvotingAccountBalance(validator, 5000)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await slasher.owner()
      assert.equal(owner, accounts[0])
    })
    it('can only be called once', async () => {
      await assertRevert(slasher.initialize(registry.address))
    })
  })

  describe('#approveSlashing()', () => {
    it('should set slashable amount', async () => {
      await slasher.approveSlashing(accounts[2], 1000)
      const amount = await slasher.getApprovedSlashing(accounts[2])
      assert.equal(amount.toNumber(), 1000)
    })
    it('should increment slashable amount when approved twice', async () => {
      await slasher.approveSlashing(accounts[2], 1000)
      await slasher.approveSlashing(accounts[2], 1000)
      const amount = await slasher.getApprovedSlashing(accounts[2])
      assert.equal(amount.toNumber(), 2000)
    })
    it('can only be called by owner', async () => {
      await assertRevert(slasher.approveSlashing(accounts[2], 1000, { from: nonOwner }))
    })
  })

  describe('#slash()', () => {
    it('fails if there is nothing to slash', async () => {
      await assertRevert(slasher.slash(validator, [], [], []))
    })
    it('decrements gold', async () => {
      await slasher.approveSlashing(validator, 1000)
      await slasher.slash(validator, [], [], [])
      const amount = await mockLockedGold.nonvotingAccountBalance(validator)
      assert.equal(amount.toNumber(), 4000)
    })
    it('has set the approved slashing to zero', async () => {
      await slasher.approveSlashing(validator, 1000)
      await slasher.slash(validator, [], [], [])
      const amount = await slasher.getApprovedSlashing(validator)
      assert.equal(amount.toNumber(), 0)
    })
  })
})
