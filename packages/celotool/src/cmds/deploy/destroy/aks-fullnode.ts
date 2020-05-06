import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { removeHelmRelease } from 'src/lib/aks-fullnode'
import { switchToClusterFromEnv } from 'src/lib/azure'
import yargs from 'yargs'

export const command = 'aks-fullnode'

export const describe = 'destroy the fullnode(s) on a kubernetes cluster on AKS'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await removeHelmRelease(argv.celoEnv)
}
