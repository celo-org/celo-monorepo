import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { createClusterIfNotExists, switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { installHelmChart } from '@celo/celotool/src/lib/ethstats'
import { fetchEnvOrFallback } from '@celo/celotool/src/lib/utils'

export const command = 'ethstats'

export const describe = 'deploy the ethstats package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await installHelmChart(argv.celoEnv)
}
