import {
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { MySingleton } from '../../migrations/singletonArtifacts'

const getContract = async (contractName: string, type: string) => {
  // console.log("MySingleton.getInstance().artifacts", Object.keys(MySingleton.getInstance().artifacts))
  console.log(contractName, type)
  if (type === 'proxiedContract') {
    // TODO remove catch
    try {
      console.log(21)
      return getDeployedProxiedContract(contractName, artifacts)
    } catch {
      console.log(22)
      return getDeployedProxiedContract(contractName, MySingleton.getInstance())
    }
  }
  if (type === 'contract') {
    // TODO remove catch
    console.log(1)
    try {
      return artifacts.require(contractName).deployed()
    } catch {
      console.log(2)
      return MySingleton.getInstance().require(contractName).deployed()
    }
  }
  // TODO remove catch
  if (type === 'proxy') {
    try {
      console.log(11)
      return artifacts.require(contractName + 'Proxy').deployed()
    } catch {
      console.log(12)
      return MySingleton.getInstance()
        .require(contractName + 'Proxy')
        .deployed()
    }
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
