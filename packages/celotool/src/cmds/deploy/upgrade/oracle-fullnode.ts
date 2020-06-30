import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addOracleMiddleware, OracleArgv, switchToAzureContextCluster } from 'src/lib/oracle'
import { upgradeOracleFullNodeChart } from 'src/lib/oracle-fullnode'
import yargs from 'yargs'

export const command = 'oracle-fullnode'

export const describe = 'upgrade the oracle full-node(s) on an AKS cluster'

type OracleFullNodeUpgradeArgv = UpgradeArgv & OracleArgv & { reset: boolean }

export const builder = (argv: yargs.Argv) => {
  return addOracleMiddleware(argv).option('reset', {
    type: 'boolean',
    description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
    default: false,
  })
}

export const handler = async (argv: OracleFullNodeUpgradeArgv) => {
  await switchToAzureContextCluster(argv.celoEnv, argv.context)
  await upgradeOracleFullNodeChart(argv.celoEnv, argv.context, argv.reset)
}
