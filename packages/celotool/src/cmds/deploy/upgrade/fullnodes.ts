import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { deployFornoLBs } from 'src/lib/forno'
import { upgradeFullNodeChart } from 'src/lib/oracle-fullnode'
import yargs from 'yargs'

export const command = 'fullnodes'

export const describe = 'deploy full nodes in a particular context'

type FullNodeUpgradeArgv = UpgradeArgv & ContextArgv & { reset: boolean }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv).option('reset', {
    type: 'boolean',
    description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
    default: false,
  })
}

export const handler = async (argv: FullNodeUpgradeArgv) => {
  console.log('holup')
  await switchToContextCluster(argv.celoEnv, argv.context)
  await upgradeFullNodeChart(argv.celoEnv, argv.context, argv.reset)
  await deployFornoLBs(argv.celoEnv)
}
