import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removeHelmRelease } from 'src/lib/komenci'
import { DestroyArgv } from '../destroy'

export const command = 'komenci'

export const describe = 'destroy the komenci package'

type KomenciDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: KomenciDestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToContextCluster(argv.celoEnv, argv.context)
  await removeHelmRelease(argv.celoEnv, argv.context)
}
