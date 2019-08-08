import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { createClusterIfNotExists, switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { removeHelmRelease } from '@celo/celotool/src/lib/ethstats'

export const command = 'ethstats'

export const describe = 'destroy the ethstats package'

type EthstatsArgv = DestroyArgv & {
  reset: boolean
}

export const builder = {}

export const handler = async (argv: EthstatsArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await removeHelmRelease(argv.celoEnv)
}
