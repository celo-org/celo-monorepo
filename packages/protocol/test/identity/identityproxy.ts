import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  IdentityProxyContract,
  IdentityProxyInstance,
  IdentityProxyTestContract,
  IdentityProxyTestInstance,
} from 'types'

const IdentityProxy: IdentityProxyContract = artifacts.require('IdentityProxy')
const IdentityProxyTest: IdentityProxyTestContract = artifacts.require('IdentityProxyTest')

contract('IdentityProxyHub', (accounts: string[]) => {
  let identityProxy: IdentityProxyInstance
  let identityProxyTest: IdentityProxyTestInstance

  beforeEach(async () => {
    identityProxy = await IdentityProxy.new()
    identityProxyTest = await IdentityProxyTest.new()
  })

  describe('makeCall', () => {
    it('can be used to forward calls', async () => {
      // @ts-ignore
      const txData = identityProxyTest.contract.methods.setX(42).encodeABI()
      await identityProxy.makeCall(identityProxyTest.address, txData)
      const x = await identityProxyTest.x()
      assert.equal(x.toNumber(), 42)
    })

    it('makes calls from the address of the proxy', async () => {
      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await identityProxy.makeCall(identityProxyTest.address, txData)
      const address = await identityProxyTest.lastAddress()
      assert.equal(address, identityProxy.address)
    })

    it('cannot be called by anyone other than the original deployer', async () => {
      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await assertRevert(
        identityProxy.makeCall(identityProxyTest.address, txData, { from: accounts[1] })
      )
    })
  })
})
