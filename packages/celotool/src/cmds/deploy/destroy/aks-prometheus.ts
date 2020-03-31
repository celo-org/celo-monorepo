import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { switchToClusterFromEnv } from 'src/lib/azure'
import { removeHelmRelease } from 'src/lib/aks-prometheus'
import yargs from 'yargs'

export const command = 'aks-prometheus'

export const describe = 'destroy prometheus on a kubernetes cluster on AKS'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await removeHelmRelease()
}
