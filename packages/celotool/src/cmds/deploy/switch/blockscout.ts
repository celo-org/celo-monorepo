import { SwitchArgv } from 'src/cmds/deploy/switch'
import { getReleaseName, switchIngressService } from 'src/lib/blockscout'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnvOrFallback } from 'src/lib/env-utils'
import yargs from 'yargs'

export const command = 'blockscout'
export const describe = 'switch the active environment for main service dns'

export const builder = (argv: yargs.Argv) => {
  return argv
}

export const handler = async (argv: SwitchArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)

  const dbSuffix = fetchEnvOrFallback(envVar.BLOCKSCOUT_DB_SUFFIX, '')
  const helmReleaseName = getReleaseName(argv.celoEnv, dbSuffix)
  await switchIngressService(argv.celoEnv, helmReleaseName)
}
