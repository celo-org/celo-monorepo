import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { installGrafanaIfNotExists, installPrometheusIfNotExists } from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster on GKE using Helm'

export type PrometheusArgv = InitialArgv &
  ContextArgv & {
    deployGrafana: boolean
  }

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
  await installPrometheusIfNotExists()
  if (argv.deployGrafana) {
    await installGrafanaIfNotExists()
  }
}
