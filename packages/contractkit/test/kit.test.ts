import { AddressRegistry } from '@src/address-registry'
import { CeloContract } from '@src/base'
import { WrapperCache } from '@src/contract-cache'
import { ContractKit, newKit, newKitFromWeb3 } from '@src/kit'
import { Web3ContractCache } from '@src/web3-contract-cache'
import Web3 from 'web3'
import { mockContractAddress } from './test-utils/mock-contracts'

describe('ContractKit', () => {
  const testUrl = 'http://127.0.0.`:8545'
  describe('instantiating a new kit', () => {
    it('can be done with a url with newKit()', () => {
      const kit = newKit(testUrl)
      expect(kit).toBeInstanceOf(ContractKit)
    })

    it('can be done with an instance of Web3 with newKitFromWeb3()', () => {
      const web3Instance = new Web3(testUrl)
      const kit = newKitFromWeb3(web3Instance)
      expect(kit).toBeInstanceOf(ContractKit)
    })

    it('has an AddressRegistry, WrapperCache and Web3ContractCache', () => {
      const kit = newKit(testUrl)
      expect(kit.registry).toBeInstanceOf(AddressRegistry)
      expect(kit._web3Contracts).toBeInstanceOf(Web3ContractCache)
      expect(kit.contracts).toBeInstanceOf(WrapperCache)
    })

    it('sets a default gasInflationFactor', () => {
      const kit = newKit(testUrl)
      expect(kit.defaultOptions).toHaveProperty('gasInflationFactor')
      expect(kit.defaultOptions.gasInflationFactor).toBeGreaterThan(0)
    })
  })

  describe('functions on the kit', () => {
    test('setGasCurrencyAddress() sets the address in defaultOptions', () => {
      const kit = newKit(testUrl)

      expect(kit.defaultOptions.gasCurrency).toBeUndefined()
      kit.setGasCurrencyAddress(mockContractAddress)
      expect(kit.defaultOptions.gasCurrency).toEqual(mockContractAddress)
    })

    describe('setGasCurrency()', () => {
      // GoldToken is the native currency, and will be used by default, without needing to specify
      test('when setting to GoldToken, it sets the address as undefined', async () => {
        const kit = newKit(testUrl)

        // To make sure it can set it to `undefined`, start with some other address
        kit.defaultOptions.gasCurrency = mockContractAddress

        await kit.setGasCurrency(CeloContract.GoldToken)
        expect(kit.defaultOptions.gasCurrency).toBeUndefined()
      })

      test('when setting to StableToken, it gets the address from the registry', async () => {
        const kit = newKit(testUrl)
        jest
          .spyOn(kit.registry, 'addressFor')
          .mockImplementation((contract: any) => Promise.resolve(mockContractAddress + contract))

        await kit.setGasCurrency(CeloContract.StableToken)
        expect(kit.registry.addressFor).toHaveBeenCalledWith(CeloContract.StableToken)
        expect(kit.defaultOptions.gasCurrency).toEqual(`${mockContractAddress}StableToken`)
        jest.clearAllMocks()
      })
    })

    describe('sendTransaction()', () => {
      it('uses values from defaultOptions in a call to web3.eth.sendTransaction', () => {
        const kit = newKit(testUrl)
        const spy = jest.spyOn(kit.web3.eth, 'sendTransaction')
      })
    })
  })
})
