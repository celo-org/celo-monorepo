import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { upgradeFullNodeChart } from 'src/lib/oracle-fullnode'
import yargs from 'yargs'

export const command = 'oracle-fullnode'

export const describe = 'upgrade the oracle full-node(s) on an AKS cluster'

type OracleFullNodeUpgradeArgv = UpgradeArgv & ContextArgv & { reset: boolean }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv).option('reset', {
    type: 'boolean',
    description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
    default: false,
  })
}

export const handler = async (argv: OracleFullNodeUpgradeArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await upgradeFullNodeChart(argv.celoEnv, argv.context, argv.reset)
}
