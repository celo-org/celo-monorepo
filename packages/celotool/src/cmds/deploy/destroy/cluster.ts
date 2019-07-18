import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { printReleases } from 'src/cmds/deploy/list'
import { deleteCluster, getNonSystemHelmReleases, switchToClusterFromEnv } from 'src/lib/cluster'
import { EnvTypes, envVar, fetchEnv } from 'src/lib/utils'

export const command = 'cluster'

export const describe = 'deletes the cluster for the given environment'

export const builder = {}

export const handler = async (_argv: DestroyArgv) => {
  const envType = fetchEnv(envVar.ENV_TYPE)
  if (envType !== EnvTypes.DEVELOPMENT) {
    console.error('You can only delete dev clusters')
    process.exit(1)
  }

  await switchToClusterFromEnv()
  const releases = await getNonSystemHelmReleases()
  if (releases.length > 0) {
    console.error('Cannot delete cluster, contains deployed packages that should be removed first')
    printReleases(releases)
    process.exit(1)
  }

  await deleteCluster()
}
