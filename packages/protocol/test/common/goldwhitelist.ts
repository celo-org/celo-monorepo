import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  GoldWhitelistContract,
  GoldWhitelistInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const GoldWhitelist: GoldWhitelistContract = artifacts.require('GoldWhitelist')
const Registry: RegistryContract = artifacts.require('Registry')

contract('GoldWhitelist', (accounts: string[]) => {
  let goldWhitelist: GoldWhitelistInstance
  let registry: RegistryInstance

  const anAddress = '0x000000000000000000000000000000000000ce10'
  const anotherAddress = '0x000000000000000000000000000000000000go1D'
  const anIdentifier: string = 'cryptokitties'
  const anotherIdentifier: string = web3.utils.soliditySha3('cryptokitties')

  const nonOwner = accounts[1]

  beforeEach(async () => {
    goldWhitelist = await GoldWhitelist.new()
  })

  describe('#addAddress()', () => {
    it('should allow the owner to add an address', async () => {
      await goldWhitelist.addAddress(anAddress)
      const whitelist = await goldWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(goldWhitelist.addAddress(anAddress, { from: nonOwner }))
    })
  })

  describe('#addRegisteredContract()', () => {
    it('should allow the owner to add a registry id', async () => {
      await goldWhitelist.addRegisteredContract(anIdentifier)
      // @ts-ignore
      const registeredContracts = await goldWhitelist.registeredContracts.call()
      assert.sameMembers(registeredContracts, [anIdentifier])
    })

    it('should not allow a non-owner to add a registry id', async () => {
      await assertRevert(goldWhitelist.addRegisteredContract(anIdentifier, { from: nonOwner }))
    })
  })

  describe('#setWhitelist()', () => {
    it('should allow the owner to set the whitelist', async () => {
      await goldWhitelist.setWhitelist([anAddress, anotherAddress])
      // @ts-ignore
      const whitelist = await goldWhitelist.whitelist.call()
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })

    it('should not allow a non-owner to set the whitelist', async () => {
      await assertRevert(
        goldWhitelist.setWhitelist([anAddress, anotherAddress], { from: nonOwner })
      )
    })
  })

  describe('#setRegisteredContracts()', () => {
    it('should allow the owner to set the list of registered contracts', async () => {
      await goldWhitelist.setRegisteredContracts([anIdentifier, anotherIdentifier])
      // @ts-ignore
      const registeredContracts = await goldWhitelist.registeredContracts.call()
      assert.sameMembers(registeredContracts, [anIdentifier, anotherIdentifier])
    })

    it('should not allow a non-owner to set the list of registered contracts', async () => {
      await assertRevert(
        goldWhitelist.setRegisteredContracts([anIdentifier, anotherIdentifier], { from: nonOwner })
      )
    })
  })

  describe('#getWhitelist()', () => {
    before('When whitelist includes both registry ids and addresses', async () => {
      registry = await Registry.new()
      await registry.initialize()
      await registry.setAddressFor(anIdentifier, anAddress)
      await goldWhitelist.addRegisteredContract(anIdentifier)
      await goldWhitelist.addAddress(anotherAddress)
    })

    it('should return the full whitelist of addresses', async () => {
      const whitelist = await goldWhitelist.getWhitelist({ from: nonOwner })
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })
  })
})
