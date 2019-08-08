import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { createClusterIfNotExists, switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { removeHelmRelease } from '@celo/celotool/src/lib/ethstats'

export const command = 'ethstats'

export const describe = 'destroy the ethstats package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await removeHelmRelease(argv.celoEnv)
}
