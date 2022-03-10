import { Connection } from '@celo/connect'
import Web3 from 'web3'
import { AllContracts } from './index'
import { Web3ContractCache } from './web3-contract-cache'
function newWeb3ContractCache() {
  const connection = new Connection(new Web3('http://localhost:8545'))
  return new Web3ContractCache(connection)
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
