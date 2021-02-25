import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import {
  addOptionalContextMiddleware,
  ContextArgv,
  switchToContextCluster,
} from 'src/lib/context-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removeGrafanaHelmRelease, removeHelmRelease } from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'destroy prometheus on a kubernetes cluster on GKE using Helm'

type PrometheusDestroyArgv = DestroyArgv & ContextArgv

export const builder = addOptionalContextMiddleware

export const handler = async (argv: PrometheusDestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  if (argv.context === undefined) {
    await switchToClusterFromEnv()
  } else {
    await switchToContextCluster(argv.celoEnv, argv.context)
  }

  await removeHelmRelease()
  await removeGrafanaHelmRelease()
}
