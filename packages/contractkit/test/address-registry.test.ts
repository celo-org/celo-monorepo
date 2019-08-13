import { Registry } from '../contracts'
import { AddressRegistry, CeloContract } from '../src/address-registry'
import { getWeb3ForTesting } from './utils'

describe('AddressRegistry', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('calls getAddressFor on the Registry contract', async () => {
    const web3 = await getWeb3ForTesting()
    const registry = await Registry(web3)
    const addressRegistry = new AddressRegistry(registry)
    const spy = jest.spyOn(registry.methods, 'getAddressFor')
    await addressRegistry.getAddressFor(CeloContract.StableToken)
    expect(spy).toHaveBeenCalledWith(CeloContract.StableToken)
  })

  it('only calls getAddressFor once for a given contract', async () => {
    const web3 = await getWeb3ForTesting()
    const registry = await Registry(web3)
    const addressRegistry = new AddressRegistry(registry)
    const spy = jest.spyOn(registry.methods, 'getAddressFor')
    await addressRegistry.getAddressFor(CeloContract.GoldToken)
    await addressRegistry.getAddressFor(CeloContract.GoldToken)
    expect(spy).toBeCalledTimes(1)
  })

  it.skip('raises an error if nothing is returned from the Registry', async () => {
    const web3 = await getWeb3ForTesting()
    const registry = await Registry(web3)
    const addressRegistry = new AddressRegistry(registry)
    // TODO: figure out how to mock the registry returning a blank address in a
    // way that actually works. Or, find some other way of testing this case
    jest.spyOn(registry.methods.getAddressFor('StableToken'), 'call').mockImplementation(() => {
      return new Promise(() => '0x0000000000000000000000000000000000000000')
    })
    await expect(addressRegistry.getAddressFor(CeloContract.StableToken)).toThrow()
  })
})
