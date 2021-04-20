import { removeHelmRelease } from 'src/lib/celostats'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../destroy'

export const command = 'celostats'

export const describe = 'destroy the celostats package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)

  await removeHelmRelease(argv.celoEnv)
}
