import { PrometheusArgv } from 'src/cmds/deploy/initial/prometheus'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { addContextMiddleware, switchToContextCluster } from 'src/lib/context-utils'
import { upgradeGrafana, upgradePrometheus } from 'src/lib/prometheus'

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
  if (argv.context === undefined) {
    await switchToClusterFromEnv()
  } else {
    await switchToContextCluster(argv.celoEnv, argv.context)
  }
  await upgradePrometheus()
  if (argv.deployGrafana) {
    await upgradeGrafana()
  }
}
