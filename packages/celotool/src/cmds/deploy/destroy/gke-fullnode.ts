import { GKEFullNodeArgv } from 'src/cmds/deploy/initial/gke-fullnode'
import { removeHelmRelease } from 'src/lib/gke-fullnode'
import yargs from 'yargs'

export const command = 'gke-fullnode'

export const describe = 'destroy the fullnode(s) Helm release on a kubernetes cluster on GKE'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: GKEFullNodeArgv) => {
  // await switchToClusterFromEnv(argv.celoEnv)
  await removeHelmRelease(argv.celoEnv, argv.syncmode)
}
