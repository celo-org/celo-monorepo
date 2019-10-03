import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/ethstats'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'ethstats'

export const describe = 'destroy the ethstats package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await removeHelmRelease(argv.celoEnv)
}
