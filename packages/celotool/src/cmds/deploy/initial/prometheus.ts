import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import {
  installGKEWorkloadMetricsIfNotExists,
  installGrafanaIfNotExists,
  installPrometheusIfNotExists,
} from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster using Helm'

export type PrometheusInitialArgv = InitialArgv &
  ContextArgv & {
    deployGKEWorkloadMetrics: boolean
    deployGrafana: boolean
    skipClusterSetup: boolean
  }

export const builder = (argv: PrometheusInitialArgv) => {
  return addContextMiddleware(argv)
    .option('deployGKEWorkloadMetrics', {
      type: 'boolean',
      description:
        'Include GKE Workload Metrics, see https://cloud.google.com/stackdriver/docs/solutions/gke/managing-metrics#workload-metrics',
      default: false,
    })
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

export const handler = async (argv: PrometheusInitialArgv) => {
  const clusterConfig = await switchToClusterFromEnvOrContext(argv, argv.skipClusterSetup)

  await installPrometheusIfNotExists(argv.context, clusterConfig)
  if (argv.deployGKEWorkloadMetrics) {
    await installGKEWorkloadMetricsIfNotExists(clusterConfig)
  }
  if (argv.deployGrafana) {
    await installGrafanaIfNotExists(argv.context, clusterConfig)
  }
}
