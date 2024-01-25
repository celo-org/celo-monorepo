import { printReleases } from 'src/cmds/deploy/list'
import { deleteCluster, getNonSystemHelmReleases, switchToClusterFromEnv } from 'src/lib/cluster'
import { envTypes, envVar, fetchEnv } from 'src/lib/env-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'cluster'

export const describe = 'deletes the cluster for the given environment'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  const envType = fetchEnv(envVar.ENV_TYPE) as envTypes
  if (envType !== envTypes.DEVELOPMENT) {
    console.error('You can only delete dev clusters')
    process.exit(1)
  }

  await switchToClusterFromEnv(argv.celoEnv)
  const releases = await getNonSystemHelmReleases()
  if (releases.length > 0) {
    console.error('Cannot delete cluster, contains deployed packages that should be removed first')
    printReleases(releases)
    process.exit(1)
  }

  await deleteCluster()
}
