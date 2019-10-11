import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  GetSetV0Instance,
  GetSetV1Instance,
  HasInitializerInstance,
  MsgSenderCheckInstance,
  ProxyInstance,
} from 'types'

const GetSetV0: Truffle.Contract<GetSetV0Instance> = artifacts.require('GetSetV0')
const GetSetV1: Truffle.Contract<GetSetV1Instance> = artifacts.require('GetSetV1')
const HasInitializer: Truffle.Contract<HasInitializerInstance> = artifacts.require(
  './contracts/HasInitializer.sol'
)
const MsgSenderCheck: Truffle.Contract<MsgSenderCheckInstance> = artifacts.require('MsgSenderCheck')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

contract('Proxy', (accounts: string[]) => {
  let proxy: ProxyInstance
  let getSet: GetSetV0Instance
  let proxiedGetSet: GetSetV0Instance

  const owner = accounts[0]

  beforeEach(async () => {
    proxy = await Proxy.new({ from: owner })
    getSet = await GetSetV0.new({ from: owner })
    proxiedGetSet = await GetSetV0.at(proxy.address)
  })

  describe('#getOwner', () => {
    it('gets the address of the owner', async () => {
      const res = await proxy._getOwner()
      assert.equal(res, owner)
    })
  })

  describe('#setImplementation', () => {
    it('should allow the owner to set an implementation', async () => {
      await proxy._setImplementation(getSet.address)
      const res = await proxy._getImplementation()
      assert.equal(res, getSet.address)
    })

    it('should not allow a non-owner to set an implementation', async () => {
      await assertRevert(proxy._setImplementation(getSet.address, { from: accounts[1] }))
    })

    it('should allow the implementation to be updated', async () => {
      await proxy._setImplementation(getSet.address)

      const getSet1: GetSetV1Instance = await GetSetV1.new()

      await proxy._setImplementation(getSet1.address)
      const res = await proxy._getImplementation()
      assert.equal(res, getSet1.address)
    })

    it('should not affect logic-related storage', async () => {
      await proxy._setImplementation(getSet.address)
      await proxiedGetSet.set(42)

      const getSet1: GetSetV1Instance = await GetSetV1.new()
      await proxy._setImplementation(getSet1.address)

      const res = await proxiedGetSet.get()
      assert.equal(res.toNumber(), 42)
    })

    it('should emit an event', async () => {
      const response = await proxy._setImplementation(getSet.address)
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'ImplementationSet')
    })
  })

  describe('#setAndInitializeImplementation', () => {
    let hasInitializer: HasInitializerInstance
    let proxiedHasInitializer: HasInitializerInstance
    const initializeData = (x: string | number) => {
      // @ts-ignore
      const initializeAbi = HasInitializer.abi.find(
        (abi: any) => abi.type === 'function' && abi.name === 'initialize'
      )

      return web3.eth.abi.encodeFunctionCall(initializeAbi, [x])
    }

    beforeEach(async () => {
      hasInitializer = await HasInitializer.new({ from: owner })
      proxiedHasInitializer = await HasInitializer.at(proxy.address)
    })

    it('should allow the owner to set an implementation', async () => {
      await proxy._setAndInitializeImplementation(hasInitializer.address, initializeData(42))

      const res = await proxy._getImplementation()
      assert.equal(res, hasInitializer.address)
    })

    it('should initialize data needed by the implementation', async () => {
      await proxy._setAndInitializeImplementation(hasInitializer.address, initializeData(42))

      const res = await proxiedHasInitializer.x()
      assert.equal(res.toNumber(), 42)
    })

    it('should emit an event', async () => {
      const response = await proxy._setAndInitializeImplementation(
        hasInitializer.address,
        initializeData(owner)
      )
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'ImplementationSet')
    })

    it('should not allow a non-owner to set an implementation', async () =>
      assertRevert(
        proxy._setAndInitializeImplementation(hasInitializer.address, initializeData(42), {
          from: accounts[1],
        })
      ))

    it('should not allow for a call to `initialize` after initialization', async () => {
      await proxy._setAndInitializeImplementation(hasInitializer.address, initializeData(42))
      await assertRevert(proxiedHasInitializer.initialize(43))
    })
  })

  describe('#transferOwnership', () => {
    it('should allow the owner to transfer ownership', async () => {
      await proxy._transferOwnership(accounts[2])
      const newOwner = await proxy._getOwner()
      assert.equal(newOwner, accounts[2])
    })

    it('should not allow a non-owner to transfer ownership', async () => {
      await assertRevert(proxy._transferOwnership(accounts[2], { from: accounts[1] }))
    })

    it('should emit an event', async () => {
      const response = await proxy._transferOwnership(accounts[2])
      const events = response.logs
      assert.equal(events.length, 1)
      assert.equal(events[0].event, 'OwnerSet')
    })

    describe('after transferring ownership', () => {
      let getSet1: GetSetV1Instance
      const newOwner: string = accounts[1]

      beforeEach(async () => {
        getSet1 = await GetSetV1.new({ from: owner })
        await proxy._transferOwnership(newOwner)
      })

      it('should allow the new owner to perform ownerOnly actions', async () => {
        await proxy._setImplementation(getSet1.address, { from: newOwner })
      })

      it('should not allow the previous owner to perform onlyOwner actions', async () => {
        await assertRevert(proxy._setImplementation(getSet1.address))
      })
    })
  })

  describe('fallback', () => {
    beforeEach(async () => {
      await proxy._setImplementation(getSet.address)
    })

    it('should call functions from the target contract', async () => {
      await proxiedGetSet.set(42)
      const res = await proxiedGetSet.get()
      assert.equal(res.toNumber(), 42)
    })

    it('should access public variables from the target contract', async () => {
      await proxiedGetSet.set(42)
      const res = await proxiedGetSet.x()
      assert.equal(res.toNumber(), 42)
    })

    it('should not affect the storage of the target contract', async () => {
      await proxiedGetSet.set(42)
      const res = await getSet.get()
      assert.equal(res.toNumber(), 0)
    })

    it('should preserve msg.sender', async () => {
      const msgSenderCheck: MsgSenderCheckInstance = await MsgSenderCheck.new()
      const proxiedMsgSenderCheck = await MsgSenderCheck.at(proxy.address)
      await proxy._setImplementation(msgSenderCheck.address)

      await proxiedMsgSenderCheck.checkMsgSender(owner)
    })

    describe('after changing the implementation', async () => {
      let getSet1: GetSetV1Instance
      let proxiedGetSet1: GetSetV1Instance

      beforeEach(async () => {
        getSet1 = await GetSetV1.new({ from: owner })
        proxiedGetSet1 = await GetSetV1.at(proxy.address)
        await proxy._setImplementation(getSet1.address)
      })

      it('should be able to proxy to the new contract', async () => {
        await proxiedGetSet1.set(42, "DON'T PANIC")
        const res = await proxiedGetSet1.get()
        assert.equal(res[0].toNumber(), 42)
        assert.equal(res[1], "DON'T PANIC")
      })
    })
  })
})
