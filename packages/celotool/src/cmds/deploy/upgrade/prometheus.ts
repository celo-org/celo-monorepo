import { PrometheusArgv } from 'src/cmds/deploy/initial/prometheus'
import { addContextMiddleware } from 'src/lib/context-utils'
import { switchPrometheusContext, upgradeGrafana, upgradePrometheus } from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'upgrade prometheus to a kubernetes cluster on GKE using Helm'

export const builder = (argv: PrometheusArgv) => {
  return addContextMiddleware(argv).option('deploy-grafana', {
    type: 'boolean',
    description: 'Include the deployment of grafana helm chart',
    default: false,
  })
}

export const handler = async (argv: PrometheusArgv) => {
  const context = await switchPrometheusContext(argv)
  await upgradePrometheus(context)
  if (argv.deployGrafana) {
    await upgradeGrafana()
  }
}
