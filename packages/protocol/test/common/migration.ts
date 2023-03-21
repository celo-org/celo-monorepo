import {
  assertContractsRegistered,
  assertProxiesSet,
  assertRegistryAddressesSet,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { MySingleton } from '../../migrations/singletonArtifacts'

const getProxiedContract = async (contractName: string) => {
  // console.log("MySingleton.getInstance('mento').artifacts", Object.keys(MySingleton.getInstance('mento').artifacts))
  // TODO remove catch
  // if (type !== undefined) {
  //   throw 'Wrong type'
  // }

  try {
    // console.log(21)
    const out = await getDeployedProxiedContract(contractName, artifacts)
    // console.log(211, out)
    return out
  } catch {
    // console.log(22)
    /* tslint:disable-next-line */
    return await getDeployedProxiedContract(contractName, MySingleton.getInstance('mento'))
  }
}

const getContract = async (contractName: string, type: string) => {
  // console.log(contractName, type)
  if (type === 'contract') {
    // TODO remove catch
    // console.log(1)
    try {
      return await artifacts.require(contractName).deployed()
    } catch {
      // console.log(2)
      /* tslint:disable-next-line */
      return await MySingleton.getInstance('mento').require(contractName).deployed()
    }
  }
  // TODO remove catch
  if (type === 'proxy') {
    try {
      // console.log(11)
      return await artifacts.require(contractName + 'Proxy').deployed()
    } catch {
      // console.log(12)
      /* tslint:disable-next-line */
      return await MySingleton.getInstance('mento')
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
      await assertContractsRegistered(getProxiedContract)
    })
  })

  describe('Checking contracts that use the registry', () => {
    it('should have set the registry address properly in all contracts that use it', async () => {
      await assertRegistryAddressesSet(getProxiedContract)
    })
  })
})
