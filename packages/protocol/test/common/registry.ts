const soliditySha3 = new (require('web3'))().utils.soliditySha3

import { assertRevert } from '@celo/protocol/lib/test-utils'
import { RegistryInstance } from 'types'

const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')

contract('Registry', (accounts: any) => {
  let registry: RegistryInstance

  const owner = accounts[0]
  const anAddress: string = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d'
  const anIdentifier: string = 'cryptokitties'

  beforeEach(async () => {
    registry = await Registry.new({ from: owner })
    await registry.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const contractOwner: string = await registry.owner()
      assert.equal(contractOwner, owner)
    })

    it('should not be callable again', async () => {
      await assertRevert(registry.initialize())
    })
  })

  describe('#setAddressFor()', () => {
    it('should allow the owner to set an address', async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      const hash: string = soliditySha3(anIdentifier)
      assert.equal(await registry.registry(hash), anAddress, 'The address should have been set')
    })

    it('should not allow a different user to set an address', async () => {
      await assertRevert(registry.setAddressFor(anIdentifier, anAddress, { from: accounts[1] }))
    })

    it('should emit an event', async () => {
      const response = await registry.setAddressFor(anIdentifier, anAddress)
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'RegistryUpdated')
      assert.equal(events[0].args.identifier, anIdentifier)
      assert.equal(events[0].args.identifierHash, soliditySha3(anIdentifier))
      assert.equal(events[0].args.addr, anAddress)
    })
  })

  describe('#getAddressForOrDie()', () => {
    it('should provide access to registry by string identifier', async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      assert.equal(await registry.getAddressForOrDie(anIdentifier), anAddress)
    })

    it('should revert if address not set', async () => {
      await assertRevert(registry.getAddressForOrDie(anIdentifier))
    })
  })

  describe('#getAddressFor()', () => {
    it('should provide access to registry by string identifier', async () => {
      await registry.setAddressFor(anIdentifier, anAddress)
      assert.equal(await registry.getAddressFor(anIdentifier), anAddress)
    })

    it('should not revert if address not set', async () => {
      await registry.getAddressFor(anIdentifier)
    })
  })
})
