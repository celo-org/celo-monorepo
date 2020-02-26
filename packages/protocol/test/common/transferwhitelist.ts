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
  const anIdentifier: string = web3.utils.soliditySha3('example1')
  const anotherIdentifier: string = web3.utils.soliditySha3('example2')

  const nonOwner = accounts[1]

  beforeEach(async () => {
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
    it('should allow the owner to add a registry id', async () => {
      await transferWhitelist.addRegisteredContract(anIdentifier)
      const registeredContractsLength = (
        await transferWhitelist.getRegisteredContractsLength()
      ).toNumber()
      const registeredContracts = []
      for (let i = 0; i < registeredContractsLength; i++) {
        registeredContracts.push(await transferWhitelist.registeredContracts.call(i))
      }
      assert.sameMembers(registeredContracts, [anIdentifier])
    })

    it('should not allow a non-owner to add a registry id', async () => {
      await assertRevert(transferWhitelist.addRegisteredContract(anIdentifier, { from: nonOwner }))
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
    it('should allow the owner to set the list of registered contracts', async () => {
      await transferWhitelist.setRegisteredContracts([anIdentifier, anotherIdentifier])
      const registeredContractsLength = (
        await transferWhitelist.getRegisteredContractsLength()
      ).toNumber()
      const registeredContracts = []
      for (let i = 0; i < registeredContractsLength; i++) {
        registeredContracts.push(await transferWhitelist.registeredContracts.call(i))
      }
      assert.sameMembers(registeredContracts, [anIdentifier, anotherIdentifier])
    })

    it('should not allow a non-owner to set the list of registered contracts', async () => {
      await assertRevert(
        transferWhitelist.setRegisteredContracts([anIdentifier, anotherIdentifier], {
          from: nonOwner,
        })
      )
    })
  })

  describe('#getWhitelist()', () => {
    before('When whitelist includes both registry ids and addresses', async () => {
      registry = await Registry.new()
      await registry.initialize()
      await registry.setAddressFor(anIdentifier, anAddress)
      await transferWhitelist.addRegisteredContract(anIdentifier)
      await transferWhitelist.addAddress(anotherAddress)
    })

    it('should return the full whitelist of addresses', async () => {
      const whitelist = await transferWhitelist.getWhitelist({ from: nonOwner })
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })
  })
})
