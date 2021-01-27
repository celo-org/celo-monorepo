import { switchToClusterFromEnv } from 'src/lib/cluster'
import { CeloEnvArgv } from 'src/lib/env-utils'
import { installGrafanaIfNotExists, installPrometheusIfNotExists } from 'src/lib/prometheus'
import yargs from 'yargs'

export const command = 'gke-prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster on GKE using Helm'

export interface GKEPrometheusArgv extends CeloEnvArgv {
  deployGrafana: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('deploy-grafana', {
    type: 'boolean',
    description: 'Include the deployment of grafana helm chart',
    default: false,
  })
}
export const handler = async (argv: GKEPrometheusArgv) => {
  await switchToClusterFromEnv()
  await installPrometheusIfNotExists()
  if (argv.deployGrafana) {
    await installGrafanaIfNotExists()
  }
}
