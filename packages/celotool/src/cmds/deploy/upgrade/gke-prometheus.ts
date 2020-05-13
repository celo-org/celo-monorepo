import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradePrometheus } from 'src/lib/prometheus'

export const command = 'gke-prometheus'

export const describe = 'upgrade prometheus to a kubernetes cluster on GKE using Helm'

export const builder = {}

export const handler = async () => {
  await switchToClusterFromEnv()
  await upgradePrometheus()
}
