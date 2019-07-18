import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { removeHelmRelease } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { deleteCloudSQLInstance } from 'src/lib/helm_deploy'
import { fetchEnvOrFallback } from 'src/lib/utils'

export const command = 'blockscout'
export const describe = 'upgrade an existing deploy of the blockscout package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()

  const instanceName = `${argv.celoEnv}${fetchEnvOrFallback('BLOCKSCOUT_DB_SUFFIX', '')}`

  // Delete replica before deleting the master
  await deleteCloudSQLInstance(instanceName + '-replica')
  await deleteCloudSQLInstance(instanceName)
  await removeHelmRelease(argv.celoEnv)
}
