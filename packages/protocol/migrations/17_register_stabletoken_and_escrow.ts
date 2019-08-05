import { escrowRegistryId, stableTokenRegistryId } from 'lib/registry-utils'
import { getDeployedProxiedContract, setInRegistry } from 'lib/web3-utils'
import { EscrowInstance, RegistryInstance, StableTokenInstance } from 'types'

module.exports = async (_deployer: any) => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    artifacts
  )
  const escrow: EscrowInstance = await getDeployedProxiedContract<EscrowInstance>(
    'Escrow',
    artifacts
  )
  await setInRegistry(stableToken, registry, stableTokenRegistryId)
  await setInRegistry(escrow, registry, escrowRegistryId)
}
