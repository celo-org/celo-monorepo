import { AddressRegistry } from '../src/address-registry'
import { CeloContract } from '../src/base'
import { newKit } from '../src/kit'
import { createMockContract } from './utils'

let mockContractAddress = 'MOCK_CONTRACT_ADDRESS'

const getAddressFor = jest.fn((_contract: CeloContract) => {
  return mockContractAddress //`0x000${contract}`
})

jest.mock('../src/generated/Registry', () => ({
  newRegistry: () => createMockContract({ getAddressFor }),
}))

describe('AddressRegistry', () => {
  afterEach(() => {
    getAddressFor.mockReset()
  })
  describe('addressFor', () => {
    it('returns the address from the Registry contract', async () => {
      mockContractAddress = 'ADDRESS_FOR_GOLD_TOKEN'
      const kit = newKit('')
      const addressRegistry = new AddressRegistry(kit)
      const addr = await addressRegistry.addressFor(CeloContract.GoldToken)
      console.info(addr)
      expect(addr).toEqual(mockContractAddress)
    })

    it('only calls the Registry contract once per contract', async () => {
      mockContractAddress = 'ADDRESS_FOR_GOLD_TOKEN'
      const kit = newKit('')
      const addressRegistry = new AddressRegistry(kit)
      await addressRegistry.addressFor(CeloContract.GoldToken)
      await addressRegistry.addressFor(CeloContract.GoldToken)
      expect(getAddressFor).toHaveBeenCalledTimes(1)
    })
  })
})
