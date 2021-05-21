import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { removeHelmRelease } from 'src/lib/odis'
import { DestroyArgv } from '../destroy'

export const command = 'odis'

export const describe = 'destroy the odis package'

type ODISDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: ODISDestroyArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await removeHelmRelease(argv.celoEnv, argv.context)
}
