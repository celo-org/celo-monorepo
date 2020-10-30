import {
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'

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
  describe('Checking proxies', () => {
    it('should have the proxy set up for all proxied contracts', async () => {
      await assertProxiesSet(getContract)
    })
  })

  describe('Checking the registry', () => {
    it('should have the correct entry in the registry for all contracts used by the registry', async () => {
      await assertContractsRegistered(getContract)
    })
  })

  describe('Checking contracts that use the registry', () => {
    it('should have set the registry address properly in all contracts that use it', async () => {
      await assertRegistryAddressesSet(getContract)
    })
  })
})
