import { createClusterIfNotExists, setupCluster, switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { InitialArgv } from '../initial'

export const command = 'setup-cluster'

export const describe = 'Create K8s cluster and deploy common tools'

export const handler = async (argv: InitialArgv) => {
  exitIfCelotoolHelmDryRun()
  const createdCluster = await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await setupCluster(argv.celoEnv, createdCluster)
}
