import { AllContracts, newKit } from '.'
import { Web3ContractCache } from './web3-contract-cache'

function newWeb3ContractCache() {
  const kit = newKit('http://localhost:8545')
  const AnyContractAddress = '0xe832065fb5117dbddcb566ff7dc4340999583e38'
  jest.spyOn(kit.registry, 'addressFor').mockResolvedValue(AnyContractAddress)
  const contractCache = new Web3ContractCache(kit)
  return contractCache
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
