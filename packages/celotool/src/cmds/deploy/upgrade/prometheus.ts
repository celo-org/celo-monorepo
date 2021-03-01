import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { upgradeGrafana, upgradePrometheus } from 'src/lib/prometheus'

export const command = 'prometheus'

export const describe = 'upgrade prometheus to a kubernetes cluster on GKE using Helm'

export type PrometheusUpgradeArgv = UpgradeArgv &
  ContextArgv & {
    deployGrafana: boolean
  }

export const builder = (argv: PrometheusUpgradeArgv) => {
  return addContextMiddleware(argv).option('deploy-grafana', {
    type: 'boolean',
    description: 'Include the deployment of grafana helm chart',
    default: false,
  })
}

export const handler = async (argv: PrometheusUpgradeArgv) => {
  const context = await switchToClusterFromEnvOrContext(argv, true)

  await upgradePrometheus(context)
  if (argv.deployGrafana) {
    await upgradeGrafana()
  }
}
