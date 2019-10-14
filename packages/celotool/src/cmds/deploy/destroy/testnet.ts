import { switchToClusterFromEnv } from 'src/lib/cluster'
import { failIfVmBased } from 'src/lib/env-utils'
import { deleteFromCluster, deleteStaticIPs } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'testnet'
export const describe = 'destroy an existing deploy of the testnet package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  failIfVmBased()

  await switchToClusterFromEnv()

  await deleteFromCluster(argv.celoEnv)
  await deleteStaticIPs(argv.celoEnv)
}
