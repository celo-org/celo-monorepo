import {
  IdentityProxyContract,
  IdentityProxyHubContract,
  IdentityProxyHubInstance,
  IdentityProxyTestContract,
  IdentityProxyTestInstance,
} from 'types'

const IdentityProxyHub: IdentityProxyHubContract = artifacts.require('IdentityProxyHub')
const IdentityProxy: IdentityProxyContract = artifacts.require('IdentityProxy')
const IdentityProxyTest: IdentityProxyTestContract = artifacts.require('IdentityProxyTest')

const concatanateHexStrings = (...strings: string[]) => {
  return `0x${strings.reduce((concatanated: string, s: string) => {
    return `${concatanated}${s.slice(2)}`
  }, '')}`
}

const computeCreate2Address = <T>(
  salt: string,
  deployerAddress: string,
  Contract: Truffle.Contract<T>
) => {
  const hash = web3.utils.soliditySha3(
    concatanateHexStrings(
      '0xff',
      deployerAddress,
      salt,
      // @ts-ignore
      web3.utils.soliditySha3(Contract._json.bytecode)
    )
  )
  return `0x${hash.slice(2 + 2 * 12)}`
}

contract('IdentityProxyHub', () => {
  let identityProxyHub: IdentityProxyHubInstance
  let identityProxyTest: IdentityProxyTestInstance
  const identifier1: string = '0x00000000000000000000000000000000000000000000000000000000babecafe'
  const identifier2: string = '0x00000000000000000000000000000000000000000000000000000000deadbeef'

  beforeEach(async () => {
    identityProxyHub = await IdentityProxyHub.new()
    identityProxyTest = await IdentityProxyTest.new()
  })

  describe('getIdentityProxy', () => {
    it('returns the correct CREATE2 address', async () => {
      const expectedAddress = computeCreate2Address(
        identifier1,
        identityProxyHub.address,
        IdentityProxy
      )
      const onchainAddress = await identityProxyHub.getIdentityProxy(identifier1)
      assert.equal(onchainAddress.toLowerCase(), expectedAddress.toLowerCase())
    })
  })

  describe('getOrDeployIdentityProxy', () => {
    it('returns the correct CREATE2 address', async () => {
      const expectedAddress = computeCreate2Address(
        identifier1,
        identityProxyHub.address,
        IdentityProxy
      )
      const onchainAddress = await identityProxyHub.getOrDeployIdentityProxy.call(identifier1)
      assert.equal(onchainAddress.toLowerCase(), expectedAddress.toLowerCase())
    })

    it('returns the address of an IdentityProxy', async () => {
      const address = await identityProxyHub.getOrDeployIdentityProxy.call(identifier1)
      await identityProxyHub.getOrDeployIdentityProxy(identifier1)
      const bytecode = await web3.eth.getCode(address)
      // @ts-ignore _json property not declared by typechain
      assert.equal(bytecode, IdentityProxy._json.deployedBytecode)
    })
  })

  describe('makeCall', () => {
    let address: string

    beforeEach(async () => {
      address = await identityProxyHub.getIdentityProxy(identifier1)
      await identityProxyHub.getOrDeployIdentityProxy(identifier1)
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
      const proxyAddress = await identityProxyHub.getIdentityProxy(identifier2)
      assert.equal(addressThatCalled, proxyAddress)
    })

    // TODO: Implement and test an identity heuristic
    // it('fails to call if sender does not match identity', async () => {})
  })
})
