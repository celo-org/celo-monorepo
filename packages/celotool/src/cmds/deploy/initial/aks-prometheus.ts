import { InitialArgv } from 'src/cmds/deploy/initial'
import { setupCluster, switchToClusterFromEnv } from 'src/lib/azure'
import { installPrometheus } from 'src/lib/aks-prometheus'
import yargs from 'yargs'

export const command = 'aks-prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster on AKS'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()
  await setupCluster(argv.celoEnv)
  await installPrometheus()
}
