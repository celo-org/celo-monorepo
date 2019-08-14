import { deployImplementationAndRepointProxy } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deployImplementationAndRepointProxy<RegistryInstance>(
  web3,
  artifacts,
  config.registry.predeployedProxyAddress,
  'Registry',
  initializeArgs
)
