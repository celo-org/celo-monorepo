import { InitialArgv } from 'src/cmds/deploy/initial'
import { installFullNodeChart } from 'src/lib/aks-fullnode'
// import { switchToCluster } from 'src/lib/azure'
import yargs from 'yargs'

export const command = 'aks-fullnode'

export const describe = 'deploy full-node(s) to a kubernetes cluster on AKS'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: InitialArgv) => {
  // await switchToClusterFromEnv(argv.celoEnv)
  await installFullNodeChart(argv.celoEnv)
}
