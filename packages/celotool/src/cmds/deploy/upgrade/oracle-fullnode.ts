import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { upgradeFullNodeChart } from 'src/lib/aks-fullnode'
import {
  addOracleMiddleware,
  getAzureClusterConfig,
  getOracleAzureContext,
  OracleArgv,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
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
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  const clusterConfig = getAzureClusterConfig(oracleAzureContext)
  await upgradeFullNodeChart(argv.celoEnv, clusterConfig, argv.reset)
}
