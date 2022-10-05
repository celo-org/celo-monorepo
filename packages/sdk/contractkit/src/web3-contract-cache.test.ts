import { Connection } from '@celo/connect'
import Web3 from 'web3'
import { AddressRegistry } from './address-registry'
import { AllContracts } from './index'
import { Web3ContractCache } from './web3-contract-cache'
function newWeb3ContractCache() {
  const web3 = new Web3('http://localhost:8545')
  const connection = new Connection(web3)
  const registry = new AddressRegistry(connection)
  const AnyContractAddress = '0xe832065fb5117dbddcb566ff7dc4340999583e38'
  jest.spyOn(registry, 'addressFor').mockResolvedValue(AnyContractAddress)

  return new Web3ContractCache(registry)
}

describe('getContract()', () => {
  const contractCache = newWeb3ContractCache()

  for (const contractName of AllContracts) {
    test(`SBAT get ${contractName}`, async () => {
      const contract = await contractCache.getContract(contractName)
      expect(contract).not.toBeNull()
      expect(contract).toBeDefined()
    })
  }
})

test('should cache contracts', async () => {
  const contractCache = newWeb3ContractCache()
  for (const contractName of AllContracts) {
    const contract = await contractCache.getContract(contractName)
    const contractBis = await contractCache.getContract(contractName)
    expect(contract).toBe(contractBis)
  }
})
