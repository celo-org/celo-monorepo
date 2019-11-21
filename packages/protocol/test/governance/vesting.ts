import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert } from '@celo/protocol/lib/test-utils'
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

const VestingFactory: VestingFactoryContract = artifacts.require('VestingFactory')
const Accounts: AccountsContract = artifacts.require('Accounts')
const LockedGold: LockedGoldContract = artifacts.require('LockedGold')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
LockedGold.numberFormat = 'BigNumber'

contract('LockedGold', (accounts: string[]) => {
  const account = accounts[0]
  let accountsInstance: AccountsInstance
  let lockedGoldInstance: LockedGoldInstance
  let goldTokenInstance: GoldTokenInstance
  let vestingFactoryInstance: VestingFactoryInstance
  let registry: RegistryInstance

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
  })

  describe('#initialize()', () => {
    it('should set the owner', async () => {
      const owner: string = await vestingFactoryInstance.owner()
      assert.equal(owner, account)
    })

    it('should set the registry address', async () => {
      const registryAddress: string = await vestingFactoryInstance.registry()
      assert.equal(registryAddress, registry.address)
    })

    it('should revert if already initialized', async () => {
      await assertRevert(vestingFactoryInstance.initialize(registry.address))
    })
  })
})
