import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import {
  addContextMiddleware,
  ContextArgv,
  serviceName,
  switchToContextCluster,
} from 'src/lib/context-utils'
import { getOracleDeployerForContext } from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'upgrade the oracle(s) on an AKS cluster'

type OracleUpgradeArgv = UpgradeArgv &
  ContextArgv & {
    useForno: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv).option('useForno', {
    description: 'Uses forno for RPCs from the oracle clients',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: OracleUpgradeArgv) => {
  const clusterManager = await switchToContextCluster(
    argv.celoEnv,
    argv.context,
    serviceName.Oracle
  )
  const deployer = getOracleDeployerForContext(
    argv.celoEnv,
    argv.context,
    argv.useForno,
    clusterManager
  )
  await deployer.upgradeChart()
}
