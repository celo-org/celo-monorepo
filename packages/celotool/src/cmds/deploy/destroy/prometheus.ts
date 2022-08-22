import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removeGrafanaHelmRelease, removePrometheus } from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'destroy prometheus chart release on a kubernetes cluster using Helm'

export type PrometheusDestroyArgv = DestroyArgv & ContextArgv

export const builder = (argv: PrometheusDestroyArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: PrometheusDestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnvOrContext(argv, true)

  await removeGrafanaHelmRelease()
  await removePrometheus()
}
