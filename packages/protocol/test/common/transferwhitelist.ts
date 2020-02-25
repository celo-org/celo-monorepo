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
  let TransferWhitelist: TransferWhitelistInstance
  let registry: RegistryInstance

  const anAddress = '0x000000000000000000000000000000000000ce10'
  const anotherAddress = '0x000000000000000000000000000000000000go1D'
  const anIdentifier: string = 'cryptokitties'
  const anotherIdentifier: string = web3.utils.soliditySha3('cryptokitties')

  const nonOwner = accounts[1]

  beforeEach(async () => {
    TransferWhitelist = await TransferWhitelist.new()
  })

  describe('#addAddress()', () => {
    it('should allow the owner to add an address', async () => {
      await TransferWhitelist.addAddress(anAddress)
      const whitelist = await TransferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(TransferWhitelist.addAddress(anAddress, { from: nonOwner }))
    })
  })

  describe('#addRegisteredContract()', () => {
    it('should allow the owner to add a registry id', async () => {
      await TransferWhitelist.addRegisteredContract(anIdentifier)
      // @ts-ignore
      const registeredContracts = await TransferWhitelist.registeredContracts.call()
      assert.sameMembers(registeredContracts, [anIdentifier])
    })

    it('should not allow a non-owner to add a registry id', async () => {
      await assertRevert(TransferWhitelist.addRegisteredContract(anIdentifier, { from: nonOwner }))
    })
  })

  describe('#setWhitelist()', () => {
    it('should allow the owner to set the whitelist', async () => {
      await TransferWhitelist.setWhitelist([anAddress, anotherAddress])
      // @ts-ignore
      const whitelist = await TransferWhitelist.whitelist.call()
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })

    it('should not allow a non-owner to set the whitelist', async () => {
      await assertRevert(
        TransferWhitelist.setWhitelist([anAddress, anotherAddress], { from: nonOwner })
      )
    })
  })

  describe('#setRegisteredContracts()', () => {
    it('should allow the owner to set the list of registered contracts', async () => {
      await TransferWhitelist.setRegisteredContracts([anIdentifier, anotherIdentifier])
      // @ts-ignore
      const registeredContracts = await TransferWhitelist.registeredContracts.call()
      assert.sameMembers(registeredContracts, [anIdentifier, anotherIdentifier])
    })

    it('should not allow a non-owner to set the list of registered contracts', async () => {
      await assertRevert(
        TransferWhitelist.setRegisteredContracts([anIdentifier, anotherIdentifier], {
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
      await TransferWhitelist.addRegisteredContract(anIdentifier)
      await TransferWhitelist.addAddress(anotherAddress)
    })

    it('should return the full whitelist of addresses', async () => {
      const whitelist = await TransferWhitelist.getWhitelist({ from: nonOwner })
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })
  })
})
