import {
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
  assertStableTokenMinter,
  getReserveBalance,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'

const getContract = async (contractName: string, type: string) => {
  if (type === 'proxiedContract') {
    return getDeployedProxiedContract(contractName, artifacts)
  }
  if (type === 'contract') {
    return artifacts.require(contractName).deployed()
  }
  if (type === 'proxy') {
    return artifacts.require(contractName + 'Proxy').deployed()
  }
}

contract('Migration', () => {
  const RESERVE_GOLD_BALANCE = config.reserve.goldBalance.toString()

  describe('Checking proxies', async () => {
    it('should have the proxy set up for all proxied contracts', async () => {
      await assertProxiesSet(getContract)
    })
  })

  describe('Checking the registry', async () => {
    it('should have the correct entry in the registry for all contracts used by the registry', async () => {
      await assertContractsRegistered(getContract)
    })
  })

  describe('Checking contracts that use the registry', async () => {
    it('should have set the registry address properly in all contracts that use it', async () => {
      await assertRegistryAddressesSet(getContract)
    })
  })

  describe('Checking Reserve balance', async () => {
    let expectedBalance: string
    beforeEach(async () => {
      expectedBalance = (await web3.utils.toWei(RESERVE_GOLD_BALANCE, 'ether')).toString()
    })

    it('should have given Reserve the right number of tokens', async () => {
      const balance: string = await getReserveBalance(web3, getContract)
      assert.equal(balance, expectedBalance)
    })
  })

  describe('Checking StableToken minter', async () => {
    it('should be set to the Reserve', async () => {
      await assertStableTokenMinter(getContract)
    })
  })
})
