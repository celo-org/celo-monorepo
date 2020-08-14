import { GKEPrometheusArgv } from 'src/cmds/deploy/initial/gke-prometheus'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeGrafana, upgradePrometheus } from 'src/lib/prometheus'

export const command = 'gke-prometheus'

export const describe = 'upgrade prometheus to a kubernetes cluster on GKE using Helm'

export const builder = {}

export const handler = async (argv: GKEPrometheusArgv) => {
  await switchToClusterFromEnv()
  await upgradePrometheus()
  if (argv.deployGrafana) {
    await upgradeGrafana()
  }
}
