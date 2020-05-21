import { GKEFullNodeArgv } from 'src/cmds/deploy/initial/gke-fullnode'
import { upgradeFullNodeChart } from 'src/lib/gke-fullnode'
import yargs from 'yargs'

export const command = 'gke-fullnode'

export const describe = 'upgrade full-node(s) to a kubernetes cluster on GKE'

export const builder = (argv: yargs.Argv) => {
  return argv.option('reset', {
    type: 'boolean',
    description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
    default: false,
  })
}

type GKEFullNodeUpgradeArgv = GKEFullNodeArgv & { reset: boolean }

export const handler = async (argv: GKEFullNodeUpgradeArgv) => {
  // await switchToClusterFromEnv(argv.celoEnv)
  await upgradeFullNodeChart(argv.celoEnv, argv.syncmode, argv.namespace, argv.reset)
}
