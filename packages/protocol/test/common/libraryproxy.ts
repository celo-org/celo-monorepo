// import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  ProxiedLibraryTestInstance,
  ProxyInstance,
  RegistryInstance,
  TestLibrary1Instance,
  TestLibrary2Instance,
  TestLibraryProxyInstance,
} from 'types'

const TestLibraryProxy: Truffle.Contract<TestLibraryProxyInstance> = artifacts.require(
  'TestLibraryProxy'
)
const TestLibrary1: Truffle.Contract<TestLibrary1Instance> = artifacts.require('TestLibrary1')
const TestLibrary2: Truffle.Contract<TestLibrary2Instance> = artifacts.require('TestLibrary2')
const ProxiedLibraryTest: Truffle.Contract<ProxiedLibraryTestInstance> = artifacts.require(
  'ProxiedLibraryTest'
)
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')
const Registry: Truffle.Contract<RegistryInstance> = artifacts.require('Registry')

contract('LibraryProxy', (accounts: string[]) => {
  let libraryProxy: TestLibraryProxyInstance
  let proxiedLibraryTest: ProxiedLibraryTestInstance
  let registry: RegistryInstance

  const owner = accounts[0]

  beforeEach(async () => {
    libraryProxy = await TestLibraryProxy.new({ from: owner })

    registry = await Registry.new()
    const testLibrary1 = await TestLibrary1.new()
    await registry.setAddressFor('TestLibrary', testLibrary1.address)

    // Technically, this test suite should be complete enough without proxying
    // the library consumer, but we do it anyway to sanity check the standard
    // way core Celo contracts are deployed.
    const proxy = await Proxy.new({ from: owner })

    // @ts-ignore Typechain doesn't expose `link`
    ProxiedLibraryTest.link('LibraryProxyShim', libraryProxy.address)
    // @ts-ignore
    ProxiedLibraryTest.link('TestLibrary1', libraryProxy.address)
    const proxiedLibraryTestImplementation = await ProxiedLibraryTest.new({ from: owner })
    await proxy._setImplementation(proxiedLibraryTestImplementation.address)
    proxiedLibraryTest = await ProxiedLibraryTest.at(proxy.address)
    await proxiedLibraryTest.initialize(registry.address)
  })

  describe('#_setRegistry', () => {
    it('should set the registry', async () => {
      await proxiedLibraryTest.setLibraryRegistryExternal(registry.address)
      const res = await proxiedLibraryTest.getLibraryRegistry()
      assert.equal(res, registry.address)
    })

    it('should allow the registry to be updated', async () => {
      await proxiedLibraryTest.setLibraryRegistryExternal(libraryProxy.address)
      await proxiedLibraryTest.setLibraryRegistryExternal(registry.address)
      const res = await proxiedLibraryTest.getLibraryRegistry()
      assert.equal(res, registry.address)
    })

    it(`should not affect the contract's own storage`, async () => {
      await proxiedLibraryTest.set(42)
      await proxiedLibraryTest.setLibraryRegistryExternal(registry.address)

      const res = await proxiedLibraryTest.get()
      assert.equal(res.toNumber(), 42)
    })
  })

  describe('when the Registry is set', () => {
    beforeEach(async () => {
      await proxiedLibraryTest.setLibraryRegistryExternal(registry.address)
    })

    it('can call a library function', async () => {
      const res = await proxiedLibraryTest.increase(2)
      assert.equal(res.toNumber(), 3)
    })

    it('can call another library function', async () => {
      const res = await proxiedLibraryTest.combine(2, 3)
      assert.equal(res.toNumber(), 5)
    })

    it(`can modify the contract's storage`, async () => {
      await proxiedLibraryTest.librarySet(42)
      const res = await proxiedLibraryTest.get()
      assert.equal(res.toNumber(), 42)
    })

    describe('when the Registry is repointed', async () => {
      beforeEach(async () => {
        const testLibrary2 = await TestLibrary2.new()
        await registry.setAddressFor('TestLibrary', testLibrary2.address)
      })

      it(`can change a library function's outcome`, async () => {
        const res = await proxiedLibraryTest.increase(2)
        assert.equal(res.toNumber(), 4)
      })

      it(`can change another library function's outcome`, async () => {
        const res = await proxiedLibraryTest.combine(2, 3)
        assert.equal(res.toNumber(), 6)
      })

      it(`can change a function that affects storage`, async () => {
        await proxiedLibraryTest.librarySet(42)
        const res = await proxiedLibraryTest.get()
        assert.equal(res.toNumber(), 21)
      })
    })
  })
})
