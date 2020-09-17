import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { upgradeFullNodeChart } from 'src/lib/fullnodes'
import yargs from 'yargs'

export const command = 'fullnodes'

export const describe = 'deploy full nodes in a particular context'

type FullNodeUpgradeArgv = UpgradeArgv &
  ContextArgv & {
    reset: boolean
    staticNodes: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv)
    .option('reset', {
      type: 'boolean',
      description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
      default: false,
    })
    .option('staticNodes', {
      type: 'boolean',
      description:
        'when enabled, generates node keys deterministically using the mnemonic and context, and uploads the enodes to GCS',
      default: false,
    })
}

export const handler = async (argv: FullNodeUpgradeArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await upgradeFullNodeChart(argv.celoEnv, argv.context, argv.reset, argv.staticNodes)
}
