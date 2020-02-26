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

  const anAddress = '0x000000000000000000000000000000000000ce10'
  const anotherAddress = '0x000000000000000000000000000000000000go1D'
  const anIdentifier: string = 'cryptokitties'
  const anotherIdentifier: string = web3.utils.soliditySha3('cryptokitties')

  const nonOwner = accounts[1]

  beforeEach(async () => {
    transferWhitelist = await TransferWhitelist.new()
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
      // @ts-ignore
      const registeredContracts = await transferWhitelist.registeredContracts.call()
      assert.sameMembers(registeredContracts, [anIdentifier])
    })

    it('should not allow a non-owner to add a registry id', async () => {
      await assertRevert(transferWhitelist.addRegisteredContract(anIdentifier, { from: nonOwner }))
    })
  })

  describe('#setWhitelist()', () => {
    it('should allow the owner to set the whitelist', async () => {
      await transferWhitelist.setWhitelist([anAddress, anotherAddress])
      // @ts-ignore
      const whitelist = await transferWhitelist.whitelist.call()
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
      // @ts-ignore
      const registeredContracts = await transferWhitelist.registeredContracts.call()
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
