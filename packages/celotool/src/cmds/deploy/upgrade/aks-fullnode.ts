import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { upgradeFullNodeChart } from 'src/lib/aks-fullnode'
import { switchToClusterFromEnv } from 'src/lib/azure'
import yargs from 'yargs'

export const command = 'aks-fullnode'

export const describe = 'upgrade full-node(s) to a kubernetes cluster on AKS'

export const builder = (argv: yargs.Argv) => {
  return argv.option('reset', {
    type: 'boolean',
    description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
    default: false,
  })
}

type AksFullNodeUpgradeArgv = UpgradeArgv & { reset: boolean }

export const handler = async (argv: AksFullNodeUpgradeArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await upgradeFullNodeChart(argv.celoEnv, argv.reset)
}
