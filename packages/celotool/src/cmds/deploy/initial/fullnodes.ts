import { InitialArgv } from 'src/cmds/deploy/initial'
import { ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { addOracleMiddleware } from 'src/lib/oracle'
import { installFullNodeChart } from 'src/lib/oracle-fullnode'

export const command = 'fullnodes'

export const describe = 'deploy full-nodes in a particular context'

type FullNodeInitialArgv = InitialArgv & ContextArgv

export const builder = addOracleMiddleware

export const handler = async (argv: FullNodeInitialArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await installFullNodeChart(argv.celoEnv, argv.context)
}
