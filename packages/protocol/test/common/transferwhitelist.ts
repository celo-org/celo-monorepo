import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  RegistryContract,
  RegistryInstance,
  TransferWhitelistContract,
  TransferWhitelistInstance,
} from 'types'

const TransferWhitelist: TransferWhitelistContract = artifacts.require('TransferWhitelist')
const Registry: RegistryContract = artifacts.require('Registry')

contract('TransferWhitelist', (accounts: string[]) => {
  let transferWhitelist: TransferWhitelistInstance
  let registry: RegistryInstance

  const anAddress = accounts[2]
  const anotherAddress = accounts[3]
  const anIdentifier: string = 'example1'
  const anotherIdentifier: string = 'example2'
  const anIdentifierHash: string = web3.utils.soliditySha3('example1')
  const anotherIdentifierHash: string = web3.utils.soliditySha3('example2')

  const nonOwner = accounts[1]

  beforeEach(async () => {
    registry = await Registry.new()
    transferWhitelist = await TransferWhitelist.new(registry.address)
  })

  describe('#addAddress()', () => {
    it('should allow the owner to add an address', async () => {
      await transferWhitelist.addAddress(anAddress)
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(transferWhitelist.addAddress(anAddress, { from: nonOwner }))
    })
  })

  describe('#addRegisteredContract()', () => {
    beforeEach(async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
    })

    it('should allow the owner to add a registry id', async () => {
      await transferWhitelist.addRegisteredContract(anIdentifierHash)
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress])
    })

    it('should not allow a non-owner to add a registry id', async () => {
      await assertRevert(
        transferWhitelist.addRegisteredContract(anIdentifierHash, { from: nonOwner })
      )
    })
  })

  describe('#setWhitelist()', () => {
    it('should allow the owner to set the whitelist', async () => {
      await transferWhitelist.setWhitelist([anAddress, anotherAddress])
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })

    it('should not allow a non-owner to set the whitelist', async () => {
      await assertRevert(
        transferWhitelist.setWhitelist([anAddress, anotherAddress], { from: nonOwner })
      )
    })
  })

  describe('#setRegisteredContracts()', () => {
    beforeEach(async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      await registry.setAddressFor(anotherIdentifier, anotherAddress)
    })

    it('should allow the owner to set the list of registered contracts', async () => {
      await transferWhitelist.setRegisteredContracts([anIdentifierHash, anotherIdentifierHash])
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })

    it('should not allow a non-owner to set the list of registered contracts', async () => {
      await assertRevert(
        transferWhitelist.setRegisteredContracts([anIdentifierHash, anotherIdentifierHash], {
          from: nonOwner,
        })
      )
    })
  })

  describe('#getWhitelist()', () => {
    beforeEach('When whitelist includes both registry ids and addresses', async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      await transferWhitelist.addRegisteredContract(anIdentifierHash)
      await transferWhitelist.addAddress(anotherAddress)
    })

    it('should return the full whitelist of addresses', async () => {
      const whitelist = await transferWhitelist.getWhitelist({ from: nonOwner })
      assert.sameMembers(whitelist, [anotherAddress, anAddress])
    })
  })
})
