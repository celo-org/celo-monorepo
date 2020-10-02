import {
  builder as initialBuilder,
  GKEPrometheusArgv,
} from 'src/cmds/deploy/initial/gke-prometheus'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeGrafana, upgradePrometheus } from 'src/lib/prometheus'
import yargs from 'yargs'

export const command = 'gke-prometheus'

export const describe = 'upgrade prometheus to a kubernetes cluster on GKE using Helm'

export const builder = (argv: yargs.Argv) => {
  initialBuilder(argv)
}

export const handler = async (argv: GKEPrometheusArgv) => {
  await switchToClusterFromEnv()
  await upgradePrometheus()
  if (argv.deployGrafana) {
    await upgradeGrafana()
  }
}
