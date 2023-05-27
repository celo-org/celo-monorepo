import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertTransactionRevertWithReason,
} from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  GovernanceSlasherContract,
  GovernanceSlasherInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const GovernanceSlasher: GovernanceSlasherContract = artifacts.require('GovernanceSlasher')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const Registry: RegistryContract = artifacts.require('Registry')

// TODO(mcortesi): Use BN
// @ts-ignore
GovernanceSlasher.numberFormat = 'BigNumber'

contract('GovernanceSlasher', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let validators: MockValidatorsInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let slasher: GovernanceSlasherInstance
  const nonOwner = accounts[1]
  const validator = accounts[1]

  beforeEach(async () => {
    accountsInstance = await Accounts.new(true)
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new(true)
    validators = await MockValidators.new()
    slasher = await GovernanceSlasher.new(true)
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, validators.address)
    await slasher.initialize(registry.address)
    await mockLockedGold.setAccountTotalLockedGold(validator, 5000)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await slasher.owner()
      assert.equal(owner, accounts[0])
    })
    it('can only be called once', async () => {
      await assertTransactionRevertWithReason(
        slasher.initialize(registry.address),
        'contract already initialized'
      )
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
      await assertTransactionRevertWithReason(
        slasher.approveSlashing(accounts[2], 1000, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#slash()', () => {
    it('fails if there is nothing to slash', async () => {
      await assertTransactionRevertWithReason(
        slasher.slash(validator, [], [], []),
        'No penalty given by governance'
      )
    })
    it('decrements gold', async () => {
      await slasher.approveSlashing(validator, 1000)
      await slasher.slash(validator, [], [], [])
      const amount = await mockLockedGold.accountTotalLockedGold(validator)
      assert.equal(amount.toNumber(), 4000)
    })
    it('has set the approved slashing to zero', async () => {
      await slasher.approveSlashing(validator, 1000)
      await slasher.slash(validator, [], [], [])
      const amount = await slasher.getApprovedSlashing(validator)
      assert.equal(amount.toNumber(), 0)
    })
    it('should emit the corresponding event', async () => {
      const amount = 1000
      await slasher.approveSlashing(validator, amount)
      const resp = await slasher.slash(validator, [], [], [])
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'GovernanceSlashPerformed',
        args: {
          account: validator,
          amount: new BigNumber(amount),
        },
      })
    })
  })
})
