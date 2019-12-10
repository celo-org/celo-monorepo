import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/leaderboard'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'leaderboard'

export const describe = 'destroy the leaderboard package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await removeHelmRelease(argv.celoEnv)
}
