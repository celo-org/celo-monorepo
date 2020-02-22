import { createClusterIfNotExists, switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/celostats'
import { DestroyArgv } from '../destroy'

export const command = 'celostats'

export const describe = 'destroy the celostats package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await createClusterIfNotExists()
  await switchToClusterFromEnv()

  await removeHelmRelease(argv.celoEnv)
}
