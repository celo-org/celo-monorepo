import {
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { ArtifactsSingleton } from '../../migrations/singletonArtifacts'

const getProxiedContract = async (contractName: string, path: string) => {
  let artifactsObject = artifacts
  if (path) {
    artifactsObject = ArtifactsSingleton.getInstance(path)
  }

  return await getDeployedProxiedContract(contractName, artifactsObject)
}

const getContract = async (contractName: string, type: string, path: string) => {
  let artifactsObject = artifacts
  if (path) {
    artifactsObject = ArtifactsSingleton.getInstance(path)
  }
  if (type === 'contract') {
    return await artifactsObject.require(contractName).deployed()
  }
  if (type === 'proxy') {
    return await artifactsObject.require(contractName + 'Proxy').deployed()
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
      await assertContractsRegistered(getProxiedContract)
    })
  })

  describe('Checking contracts that use the registry', () => {
    it('should have set the registry address properly in all contracts that use it', async () => {
      await assertRegistryAddressesSet(getProxiedContract)
    })
  })
})
