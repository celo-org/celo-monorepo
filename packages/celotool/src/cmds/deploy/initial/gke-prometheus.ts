import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installPrometheusIfNotExists } from 'src/lib/prometheus'
import yargs from 'yargs'

export const command = 'gke-prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster on GKE using Helm'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async () => {
  await switchToClusterFromEnv()
  await installPrometheusIfNotExists()
}
