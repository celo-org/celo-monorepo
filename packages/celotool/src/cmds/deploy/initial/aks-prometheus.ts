import { InitialArgv } from 'src/cmds/deploy/initial'
import { installPrometheus } from 'src/lib/aks-prometheus'
import { switchToClusterFromEnv } from 'src/lib/azure'
import yargs from 'yargs'

export const command = 'aks-prometheus'

export const describe = 'deploy prometheus to a kubernetes cluster on AKS'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await installPrometheus()
}
