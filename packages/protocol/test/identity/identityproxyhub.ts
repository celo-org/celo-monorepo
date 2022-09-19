import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  IdentityProxyContract,
  IdentityProxyHubContract,
  IdentityProxyHubInstance,
  IdentityProxyTestContract,
  IdentityProxyTestInstance,
  MockAttestationsContract,
  MockAttestationsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const IdentityProxyHub: IdentityProxyHubContract = artifacts.require('IdentityProxyHub')
const IdentityProxy: IdentityProxyContract = artifacts.require('IdentityProxy')
const IdentityProxyTest: IdentityProxyTestContract = artifacts.require('IdentityProxyTest')
const MockAttestations: MockAttestationsContract = artifacts.require('MockAttestations')
const Registry: RegistryContract = artifacts.require('Registry')

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
  // Skip '0x' and the first 12 bytes (so take the last 20 bytes).
  return `0x${hash.slice(2 + 2 * 12)}`
}

contract('IdentityProxyHub', (accounts: string[]) => {
  let identityProxyHub: IdentityProxyHubInstance
  let identityProxyTest: IdentityProxyTestInstance
  let attestations: MockAttestationsInstance
  let registry: RegistryInstance
  const identifier: string = '0x00000000000000000000000000000000000000000000000000000000babecafe'

  beforeEach(async () => {
    registry = await Registry.new(true)
    await registry.initialize()
    attestations = await MockAttestations.new()
    await registry.setAddressFor('Attestations', attestations.address)

    identityProxyHub = await IdentityProxyHub.new()
    identityProxyTest = await IdentityProxyTest.new()
    await identityProxyHub.setRegistry(registry.address)
  })

  describe('getIdentityProxy', () => {
    it('returns the correct CREATE2 address', async () => {
      const expectedAddress = computeCreate2Address(
        identifier,
        identityProxyHub.address,
        IdentityProxy
      )
      const onchainAddress = await identityProxyHub.getIdentityProxy(identifier)
      assert.equal(onchainAddress.toLowerCase(), expectedAddress.toLowerCase())
    })
  })

  describe('getOrDeployIdentityProxy', () => {
    it('returns the correct CREATE2 address', async () => {
      const expectedAddress = computeCreate2Address(
        identifier,
        identityProxyHub.address,
        IdentityProxy
      )
      const onchainAddress = await identityProxyHub.getOrDeployIdentityProxy.call(identifier)
      assert.equal(onchainAddress.toLowerCase(), expectedAddress.toLowerCase())
    })

    it('returns the address of an IdentityProxy', async () => {
      const address = await identityProxyHub.getOrDeployIdentityProxy.call(identifier)
      await identityProxyHub.getOrDeployIdentityProxy(identifier)
      const bytecode = await web3.eth.getCode(address)
      // @ts-ignore _json property not declared by typechain
      assert.equal(bytecode, IdentityProxy._json.deployedBytecode)
    })
  })

  describe('makeCall', () => {
    let address: string

    beforeEach(async () => {
      address = await identityProxyHub.getIdentityProxy(identifier)
    })

    describe('when called by a contract related to the identifier', () => {
      beforeEach(async () => {
        await attestations.complete(identifier, 0, '0x0', '0x0')
        await attestations.complete(identifier, 0, '0x0', '0x0')
        await attestations.complete(identifier, 0, '0x0', '0x0')
      })

      it('forwards calls to the destination', async () => {
        // @ts-ignore
        const txData = identityProxyTest.contract.methods.setX(42).encodeABI()
        await identityProxyHub.makeCall(identifier, identityProxyTest.address, txData)
        const x = await identityProxyTest.x()
        assert.equal(x.toNumber(), 42)
      })

      it('forwards calls even when completed/requested ration is close to 50%', async () => {
        await attestations.request(identifier, 0, '0x0', '0x0')
        await attestations.request(identifier, 0, '0x0', '0x0')
        await attestations.request(identifier, 0, '0x0', '0x0')
        await attestations.request(identifier, 0, '0x0', '0x0')
        await attestations.request(identifier, 0, '0x0', '0x0')

        // @ts-ignore
        const txData = identityProxyTest.contract.methods.setX(42).encodeABI()
        await identityProxyHub.makeCall(identifier, identityProxyTest.address, txData)
        const x = await identityProxyTest.x()
        assert.equal(x.toNumber(), 42)
      })

      it('forwards calls as long as no other address has more completions', async () => {
        await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })
        await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })
        await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })

        // @ts-ignore
        const txData = identityProxyTest.contract.methods.setX(42).encodeABI()
        await identityProxyHub.makeCall(identifier, identityProxyTest.address, txData)
        const x = await identityProxyTest.x()
        assert.equal(x.toNumber(), 42)
      })

      it('forwards a call through the proxy related to the identifier', async () => {
        // @ts-ignore
        const txData = identityProxyTest.contract.methods.callMe().encodeABI()
        await identityProxyHub.makeCall(identifier, identityProxyTest.address, txData)
        const addressThatCalled = await identityProxyTest.lastAddress()
        assert.equal(address, addressThatCalled)
      })

      it('can send a payment', async () => {
        const balanceBefore = await web3.eth.getBalance(identityProxyTest.address)
        // @ts-ignore
        const txData = identityProxyTest.contract.methods.payMe().encodeABI()
        // @ts-ignore
        await identityProxyHub.makeCall(identifier, identityProxyTest.address, txData, {
          value: '100',
        })
        const proxyBalance = await web3.eth.getBalance(address)
        const balanceAfter = await web3.eth.getBalance(identityProxyTest.address)
        assert.equal(balanceBefore, 0)
        assert.equal(proxyBalance, 0)
        assert.equal(balanceAfter, 100)
      })
    })

    it('fails to call if sender does not have at least 3 attestation completions', async () => {
      await attestations.complete(identifier, 0, '0x0', '0x0')
      await attestations.complete(identifier, 0, '0x0', '0x0')

      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await assertRevert(identityProxyHub.makeCall(identifier, identityProxyTest.address, txData))
    })

    it('fails to call if sender does not have more than 50% attestation completions', async () => {
      await attestations.complete(identifier, 0, '0x0', '0x0')
      await attestations.complete(identifier, 0, '0x0', '0x0')
      await attestations.complete(identifier, 0, '0x0', '0x0')

      await attestations.request(identifier, 0, '0x0', '0x0')
      await attestations.request(identifier, 0, '0x0', '0x0')
      await attestations.request(identifier, 0, '0x0', '0x0')
      await attestations.request(identifier, 0, '0x0', '0x0')
      await attestations.request(identifier, 0, '0x0', '0x0')
      await attestations.request(identifier, 0, '0x0', '0x0')

      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await assertRevert(identityProxyHub.makeCall(identifier, identityProxyTest.address, txData))
    })

    it('fails to call if another address has more attestations completed', async () => {
      await attestations.complete(identifier, 0, '0x0', '0x0')
      await attestations.complete(identifier, 0, '0x0', '0x0')
      await attestations.complete(identifier, 0, '0x0', '0x0')

      await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })
      await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })
      await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })
      await attestations.complete(identifier, 0, '0x0', '0x0', { from: accounts[1] })

      // @ts-ignore
      const txData = identityProxyTest.contract.methods.callMe().encodeABI()
      await assertRevert(identityProxyHub.makeCall(identifier, identityProxyTest.address, txData))
    })
  })
})
