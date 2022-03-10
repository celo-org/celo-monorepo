import { Connection } from '@celo/connect'
import Web3 from 'web3'
import { AddressRegistry } from './address-registry'
import { WrapperCache } from './contract-cache'
import { AllContracts } from './index'
import { Web3ContractCache } from './web3-contract-cache'
function newWeb3ContractCache() {
  const connection = new Connection(new Web3('http://localhost:8545'))
  const web3ContractCache = new Web3ContractCache(connection)
  const registry = new AddressRegistry(connection)
  const AnyContractAddress = '0xe832065fb5117dbddcb566ff7dc4340999583e38'
  jest.spyOn(registry, 'addressFor').mockResolvedValue(AnyContractAddress)
  const contractCache = new WrapperCache(connection, web3ContractCache, registry)
  return contractCache
}

describe('getContract()', () => {
  const contractCache = newWeb3ContractCache()

  for (const contractName of AllContracts) {
    test(`SBAT get ${contractName}`, async () => {
      // Why is this testing contractCache and not Web3ContractCache?
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
