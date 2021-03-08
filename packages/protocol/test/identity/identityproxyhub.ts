import {
  IdentityProxyHubContract,
  IdentityProxyHubInstance,
  IdentityProxyContract,
  IdentityProxyTestContract,
  IdentityProxyTestInstance,
} from 'types'

const IdentityProxyHub: IdentityProxyHubContract = artifacts.require('IdentityProxyHub')
const IdentityProxy: IdentityProxyContract = artifacts.require('IdentityProxy')
const IdentityProxyTest: IdentityProxyTestContract = artifacts.require('IdentityProxyTest')

contract('IdentityProxyHub', () => {
  let identityProxyHub: IdentityProxyHubInstance
  let identityProxyTest: IdentityProxyTestInstance
  let identifier1: string = '0x00000000000000000000000000000000000000000000000000000000babecafe'
  let identifier2: string = '0x00000000000000000000000000000000000000000000000000000000deadbeef'

  beforeEach(async () => {
    identityProxyHub = await IdentityProxyHub.new()
    identityProxyTest = await IdentityProxyTest.new()
  })

  describe('getIdentityProxy', () => {
    it('returns a non-zero address', async () => {
      const address = await identityProxyHub.getIdentityProxy.call(identifier1)
      assert.notEqual(address, '0x0000000000000000000000000000000000000000')
    })

    it('returns the address of an IdentityProxy', async () => {
      const address = await identityProxyHub.getIdentityProxy.call(identifier1)
      await identityProxyHub.getIdentityProxy(identifier1)
      const bytecode = await web3.eth.getCode(address)
      // @ts-ignore _json property not declared by typechain
      assert.equal(IdentityProxy._json.deployedBytecode, bytecode)
    })

    it('returns different addresses for different identifiers', async () => {
      const address1 = await identityProxyHub.getIdentityProxy.call(identifier1)
      await identityProxyHub.getIdentityProxy(identifier1)
      const address2 = await identityProxyHub.getIdentityProxy.call(identifier2)
      assert.notEqual(address1, address2)
    })

    it('returns the same address each time for a given identifier', async () => {
      const address1 = await identityProxyHub.getIdentityProxy.call(identifier1)
      await identityProxyHub.getIdentityProxy(identifier1)
      const address2 = await identityProxyHub.getIdentityProxy.call(identifier1)
      assert.equal(address1, address2)
    })
  })

  describe('makeCall', () => {
    let address: string

    beforeEach(async () => {
      address = await identityProxyHub.getIdentityProxy.call(identifier1)
      await identityProxyHub.getIdentityProxy(identifier1)
    })

    it('forwards calls to the destination', async () => {
      // @ts-ignore
      const txData = identityProxyTest.contract.methods.setX(42).encodeABI()
      await identityProxyHub.makeCall(identifier1, identityProxyTest.address, 0, txData)
      const x = await identityProxyTest.x()
      assert.equal(x.toNumber(), 42)
    })

    it('forwards a call through the proxy related to the identifier', async () => {
      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await identityProxyHub.makeCall(identifier1, identityProxyTest.address, 0, txData)
      const addressThatCalled = await identityProxyTest.lastAddress()
      assert.equal(address, addressThatCalled)
    })

    it('provisions a proxy if one did not exist yet', async () => {
      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await identityProxyHub.makeCall(identifier2, identityProxyTest.address, 0, txData)
      const addressThatCalled = await identityProxyTest.lastAddress()
      const proxyAddress = await identityProxyHub.getIdentityProxy.call(identifier2)
      assert.equal(addressThatCalled, proxyAddress)
    })

    it.skip('fails to call if sender does not match identity', async () => {})
  })
})
