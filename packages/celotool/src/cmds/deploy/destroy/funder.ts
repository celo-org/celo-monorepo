import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { removeHelmRelease } from 'src/lib/funder'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { DestroyArgv } from '../destroy'

export const command = 'funder'

export const describe = 'destroy the funder deployment'

type FunderDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: FunderDestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToContextCluster(argv.celoEnv, argv.context)
  await removeHelmRelease(argv.celoEnv, argv.context)
}
