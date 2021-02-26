import { PrometheusArgv } from 'src/cmds/deploy/initial/prometheus'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import {
  removeGrafanaHelmRelease,
  removePrometheus,
  switchPrometheusContext,
} from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'destroy prometheus chart release on a kubernetes cluster using Helm'

export const handler = async (argv: PrometheusArgv) => {
  exitIfCelotoolHelmDryRun()
  switchPrometheusContext(argv)

  await removePrometheus()
  await removeGrafanaHelmRelease()
}
