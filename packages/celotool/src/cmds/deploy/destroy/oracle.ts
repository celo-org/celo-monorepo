import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { removeHelmRelease } from 'src/lib/oracle'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'oracle'

export const describe = 'destroy the oracle package'

type OracleDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: OracleDestroyArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await removeHelmRelease(argv.celoEnv, argv.context)
}
