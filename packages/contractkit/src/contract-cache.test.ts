import { CeloContract, newKit } from '.'
import { ValidWrappers, WrapperCache } from './contract-cache'

const TestedWrappers: ValidWrappers[] = [
  CeloContract.GoldToken,
  CeloContract.StableToken,
  CeloContract.Exchange,
  CeloContract.Validators,
  CeloContract.LockedGold,
]

function newWrapperCache() {
  const kit = newKit('http://localhost:8545')
  const AnyContractAddress = '0xe832065fb5117dbddcb566ff7dc4340999583e38'
  jest.spyOn(kit.registry, 'addressFor').mockResolvedValue(AnyContractAddress)
  const contractCache = new WrapperCache(kit)
  return contractCache
}

describe('getContract()', () => {
  const contractCache = newWrapperCache()

  for (const contractName of TestedWrappers) {
    test(`SBAT get ${contractName}`, async () => {
      const contract = await contractCache.getContract(contractName)
      expect(contract).not.toBeNull()
      expect(contract).toBeDefined()
    })
  }
})

test('should cache contracts', async () => {
  const contractCache = newWrapperCache()
  for (const contractName of TestedWrappers) {
    const contract = await contractCache.getContract(contractName)
    const contractBis = await contractCache.getContract(contractName)
    expect(contract).toBe(contractBis)
  }
})
