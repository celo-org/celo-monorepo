import { SwitchArgv } from 'src/cmds/deploy/switch'
import { getReleaseName, switchIngressService } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import yargs from 'yargs'

export const command = 'blockscout'
export const describe = 'switch the active environment for main service dns'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: SwitchArgv) => {
  await switchToClusterFromEnv()

  const helmReleaseName = getReleaseName(argv.celoEnv)
  await switchIngressService(argv.celoEnv, helmReleaseName)
}
