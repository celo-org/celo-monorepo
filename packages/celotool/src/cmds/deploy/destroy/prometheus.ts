import { PrometheusArgv } from 'src/cmds/deploy/initial/prometheus'
import { addContextMiddleware } from 'src/lib/context-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import {
  removeGrafanaHelmRelease,
  removePrometheus,
  switchPrometheusContext,
} from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'destroy prometheus chart release on a kubernetes cluster using Helm'

export const builder = (argv: PrometheusArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: PrometheusArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchPrometheusContext(argv)

  await removePrometheus()
  await removeGrafanaHelmRelease()
}
