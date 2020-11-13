import { DestroyArgv } from 'src/cmds/deploy/destroy'
import {
  addContextMiddleware,
  ContextArgv,
  serviceName,
  switchToContextCluster,
} from 'src/lib/context-utils'
import { removeFullNodeChart } from 'src/lib/fullnodes'

export const command = 'fullnodes'

export const describe = 'deploy full-nodes in a particular context'

type FullNodeDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: FullNodeDestroyArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context, serviceName.Fullnode)
  await removeFullNodeChart(argv.celoEnv, argv.context)
}
