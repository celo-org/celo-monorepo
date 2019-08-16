import { AddressRegistry } from '../src/address-registry'
import { AllContracts, CeloContract, NULL_ADDRESS } from '../src/base'
import { newKit } from '../src/kit'
import { createMockContract } from './utils'

const mockContractAddress = '0x00000000000_FAKE_ADDRESS'

const mockedGetAddressFor = jest.fn()

jest.mock('../src/generated/Registry', () => ({
  newRegistry: () => createMockContract({ getAddressFor: mockedGetAddressFor }),
}))

describe('AddressRegistry', () => {
  beforeEach(() => {
    mockedGetAddressFor.mockReturnValue(mockContractAddress)
  })

  afterEach(() => {
    mockedGetAddressFor.mockClear()
  })

  describe('addressFor', () => {
    it('returns the address from the Registry contract', async () => {
      const addressRegistry = new AddressRegistry(newKit(''))
      const addr = await addressRegistry.addressFor(CeloContract.GoldToken)
      expect(addr).toEqual(mockContractAddress)
    })

    it('only calls the Registry contract once per contract', async () => {
      const addressRegistry = new AddressRegistry(newKit(''))
      await addressRegistry.addressFor(CeloContract.GoldToken)
      await addressRegistry.addressFor(CeloContract.GoldToken)
      expect(mockedGetAddressFor).toHaveBeenCalledTimes(1)

      await addressRegistry.addressFor(CeloContract.StableToken)
      expect(mockedGetAddressFor).toHaveBeenCalledTimes(2)
    })

    describe('getting the address for the Registry contract', () => {
      it('does not call the Registry contract because this is known, and hard-coded', async () => {
        const addressRegistry = new AddressRegistry(newKit(''))
        await addressRegistry.addressFor(CeloContract.Registry)
        expect(mockedGetAddressFor).toHaveBeenCalledTimes(0)
      })

      it('returns the address that the Registry is always deployed to', async () => {
        const addressRegistry = new AddressRegistry(newKit(''))
        expect(await addressRegistry.addressFor(CeloContract.Registry)).toEqual(
          '0x000000000000000000000000000000000000ce10'
        )
      })
    })

    describe('when the address cannot be found', () => {
      beforeEach(() => {
        mockedGetAddressFor.mockReturnValueOnce(NULL_ADDRESS)
      })

      it('raises an error', async () => {
        const addressRegistry = new AddressRegistry(newKit(''))
        await expect(addressRegistry.addressFor(CeloContract.GoldToken)).rejects.toThrow(
          'Failed to get address for GoldToken from the Registry'
        )
      })
    })
  })

  describe('allAddresses', () => {
    it('calls getAddressFor on the Registry once per contract in AllContracts', async () => {
      const addressRegistry = new AddressRegistry(newKit(''))
      await addressRegistry.allAddresses()
      expect(mockedGetAddressFor).toHaveBeenCalledTimes(AllContracts.length - 1)
    })

    it('calls to the Registry only happen once per contract', async () => {
      const addressRegistry = new AddressRegistry(newKit(''))
      await addressRegistry.allAddresses()
      await addressRegistry.allAddresses()
      expect(mockedGetAddressFor).toHaveBeenCalledTimes(AllContracts.length - 1)
    })

    it('returns an object with entries for each contract', async () => {
      const addressRegistry = new AddressRegistry(newKit(''))
      const result = await addressRegistry.allAddresses()
      for (const contract of AllContracts) {
        expect(result).toHaveProperty(contract)
      }
    })
  })
})
