import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import {
  installGrafanaIfNotExists,
  installPrometheusIfNotExists,
  switchPrometheusContext,
} from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster on GKE using Helm'

export type PrometheusArgv = InitialArgv &
  ContextArgv & {
    deployGrafana: boolean
  }

export const builder = (argv: PrometheusArgv) => {
  return addContextMiddleware(argv)
    .option('deploy-grafana', {
      type: 'boolean',
      description: 'Include the deployment of grafana helm chart',
      default: false,
    })
    .option('skipClusterSetup', {
      type: 'boolean',
      description: 'If you know that you can skip the cluster setup',
      default: false,
    })
}

export const handler = async (argv: PrometheusArgv) => {
  const context = await switchPrometheusContext(argv)

  await installPrometheusIfNotExists(context)
  if (argv.deployGrafana) {
    await installGrafanaIfNotExists()
  }
}
