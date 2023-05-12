import {
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { ArtifactsSingleton } from '../../migrations/singletonArtifacts'

const getProxiedContract = async (contractName: string, path: string) => {
  const artifactsObject = ArtifactsSingleton.getInstance(path, artifacts)
  /* tslint:disable-next-line */
  return await getDeployedProxiedContract(contractName, artifactsObject)
}

const getContract = async (contractName: string, type: string, path: string) => {
  // /* tslint:disable-next-line */
  const artifactsObject = ArtifactsSingleton.getInstance(path, artifacts)

  if (type === 'contract') {
    /* tslint:disable-next-line */
    return await artifactsObject.require(contractName).deployed()
  }
  if (type === 'proxy') {
    /* tslint:disable-next-line */
    return await artifactsObject.require(contractName + 'Proxy').deployed()
  }
}

contract('Migration', () => {
  describe('Checking proxies', () => {
    it.skip('should have the proxy set up for all proxied contracts', async () => {
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
