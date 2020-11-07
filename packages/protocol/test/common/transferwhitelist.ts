import { assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
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

  describe('#whitelistAddress()', () => {
    it('should allow the owner to add an address', async () => {
      await transferWhitelist.whitelistAddress(anAddress)
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress])
    })

    it('should emit the corresponding event', async () => {
      const resp = await transferWhitelist.whitelistAddress(anAddress)
      assertLogMatches2(resp.logs[0], {
        event: 'WhitelistedAddress',
        args: { addr: anAddress },
      })
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(transferWhitelist.whitelistAddress(anAddress, { from: nonOwner }))
    })
  })

  describe('#removeAddress()', () => {
    beforeEach(async () => {
      await transferWhitelist.whitelistAddress(anAddress)
    })

    it('should allow the owner to remove an address', async () => {
      await transferWhitelist.removeAddress(anAddress, 0)
      const whitelist = await transferWhitelist.getWhitelist()
      assert.equal(whitelist.length, 0)
    })

    it('should emit the corresponding event', async () => {
      const resp = await transferWhitelist.removeAddress(anAddress, 0)
      assertLogMatches2(resp.logs[0], {
        event: 'WhitelistedAddressRemoved',
        args: { addr: anAddress },
      })
    })

    it('should not allow a non-owner to remove an address', async () => {
      await assertRevert(transferWhitelist.removeAddress(anAddress, 0, { from: nonOwner }))
    })
  })

  describe('#whitelistRegisteredContract()', () => {
    beforeEach(async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
    })

    it('should allow the owner to add a registry id', async () => {
      await transferWhitelist.whitelistRegisteredContract(anIdentifierHash)
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress])
    })

    it('should not allow a non-owner to add a registry id', async () => {
      await assertRevert(
        transferWhitelist.whitelistRegisteredContract(anIdentifierHash, { from: nonOwner })
      )
    })
  })

  describe('#setDirectlyWhitelistedAddresses()', () => {
    it('should allow the owner to set the whitelist', async () => {
      await transferWhitelist.setDirectlyWhitelistedAddresses([anAddress, anotherAddress])
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })

    it('should emit the corresponding events', async () => {
      const resp = await transferWhitelist.setDirectlyWhitelistedAddresses([
        anAddress,
        anotherAddress,
      ])
      assertLogMatches2(resp.logs[0], {
        event: 'WhitelistedAddress',
        args: { addr: anAddress },
      })
      assertLogMatches2(resp.logs[1], {
        event: 'WhitelistedAddress',
        args: { addr: anotherAddress },
      })
    })

    it('should not allow a non-owner to set the whitelist', async () => {
      await assertRevert(
        transferWhitelist.setDirectlyWhitelistedAddresses([anAddress, anotherAddress], {
          from: nonOwner,
        })
      )
    })
  })

  describe('#setWhitelistedContractIdentifiers()', () => {
    beforeEach(async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      await registry.setAddressFor(anotherIdentifier, anotherAddress)
    })

    it('should allow the owner to set the list of registered contracts', async () => {
      await transferWhitelist.setWhitelistedContractIdentifiers([
        anIdentifierHash,
        anotherIdentifierHash,
      ])
      const whitelist = await transferWhitelist.getWhitelist()
      assert.sameMembers(whitelist, [anAddress, anotherAddress])
    })

    it('should not allow a non-owner to set the list of registered contracts', async () => {
      await assertRevert(
        transferWhitelist.setWhitelistedContractIdentifiers(
          [anIdentifierHash, anotherIdentifierHash],
          {
            from: nonOwner,
          }
        )
      )
    })
  })

  describe('#getWhitelist()', () => {
    beforeEach('When whitelist includes both registry ids and addresses', async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      await transferWhitelist.whitelistRegisteredContract(anIdentifierHash)
      await transferWhitelist.whitelistAddress(anotherAddress)
    })

    it('should return the full whitelist of addresses', async () => {
      const whitelist = await transferWhitelist.getWhitelist({ from: nonOwner })
      assert.sameMembers(whitelist, [anotherAddress, anAddress])
    })
  })
})
