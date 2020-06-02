import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import {
  addOracleMiddleware,
  getOracleAzureContext,
  OracleArgv,
  switchToAzureContextCluster,
  upgradeOracleChart,
} from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'upgrade the oracle(s) on an AKS cluster'

type OracleUpgradeArgv = UpgradeArgv &
  OracleArgv & {
    useForno: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addOracleMiddleware(argv).option('useFullNodes', {
    description: 'Uses previously deployed full nodes in the same namespace for RPCs',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: OracleUpgradeArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  await upgradeOracleChart(argv.celoEnv, oracleAzureContext, argv.useForno)
}
