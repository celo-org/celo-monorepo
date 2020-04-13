import { SwitchArgv } from 'src/cmds/deploy/switch'
import { switchIngressService } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { fetchEnvOrFallback } from 'src/lib/env-utils'
import yargs from 'yargs'

export const command = 'blockscout'
export const describe = 'switch the active environment for main service dns'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: SwitchArgv) => {
  await switchToClusterFromEnv()
  const helmReleaseName = `${argv.celoEnv}-blockscout${fetchEnvOrFallback(
    'BLOCKSCOUT_DB_SUFFIX',
    ''
  )}`
  await switchIngressService(argv.celoEnv, helmReleaseName)
}
