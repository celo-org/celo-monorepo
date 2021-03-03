import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removeGrafanaHelmRelease, removeHelmRelease } from 'src/lib/prometheus'
import yargs from 'yargs'

export const command = 'gke-prometheus'

export const describe = 'destroy prometheus on a kubernetes cluster on GKE using Helm'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async () => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv()
  await removeHelmRelease()
  await removeGrafanaHelmRelease()
}
