import { Connection } from '@celo/connect'
import Web3 from 'web3'
import { CeloContract } from '.'
import { AddressRegistry } from './address-registry'
import { ValidWrappers, WrapperCache } from './contract-cache'
import { Web3ContractCache } from './web3-contract-cache'

const TestedWrappers: ValidWrappers[] = [
  CeloContract.GoldToken,
  CeloContract.StableToken,
  CeloContract.StableTokenEUR,
  CeloContract.Exchange,
  CeloContract.ExchangeEUR,
  CeloContract.Validators,
  CeloContract.LockedGold,
]

function newWrapperCache() {
  const web3 = new Web3('http://localhost:8545')
  const connection = new Connection(web3)
  const registry = new AddressRegistry(connection)
  const web3ContractCache = new Web3ContractCache(registry)
  const AnyContractAddress = '0xe832065fb5117dbddcb566ff7dc4340999583e38'
  jest.spyOn(registry, 'addressFor').mockResolvedValue(AnyContractAddress)
  const contractCache = new WrapperCache(connection, web3ContractCache, registry)
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

  test('should create a new instance when an address is provided', async () => {
    const address1 = Web3.utils.randomHex(20)
    const address2 = Web3.utils.randomHex(20)
    const contract1 = await contractCache.getContract(CeloContract.MultiSig, address1)
    const contract2 = await contractCache.getContract(CeloContract.MultiSig, address2)
    expect(contract1?.address).not.toEqual(contract2?.address)
  })
})

test('should cache contracts', async () => {
  const contractCache = newWrapperCache()
  for (const contractName of TestedWrappers) {
    const contract = await contractCache.getContract(contractName)
    const contractBis = await contractCache.getContract(contractName)
    expect(contract).toBe(contractBis)
  }
})
