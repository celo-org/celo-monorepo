import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import {
  addOracleMiddleware,
  OracleArgv,
  switchToOracleContextCluster,
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
  return addOracleMiddleware(argv).option('useForno', {
    description: 'Uses forno for RPCs from the oracle clients',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: OracleUpgradeArgv) => {
  await switchToOracleContextCluster(argv.celoEnv, argv.context)
  await upgradeOracleChart(argv.celoEnv, argv.context, argv.useForno)
}
