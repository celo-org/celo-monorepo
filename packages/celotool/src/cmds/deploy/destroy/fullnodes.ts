import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { addOracleMiddleware } from 'src/lib/oracle'
import { removeFullNodeChart } from 'src/lib/oracle-fullnode'

export const command = 'fullnodes'

export const describe = 'deploy full-nodes in a particular context'

type FullNodeDestroyArgv = DestroyArgv & ContextArgv

export const builder = addOracleMiddleware

export const handler = async (argv: FullNodeDestroyArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await removeFullNodeChart(argv.celoEnv, argv.context)
}
