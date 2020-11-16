import {
  addContextMiddleware,
  ContextArgv,
  serviceName,
  switchToContextCluster,
} from 'src/lib/context-utils'
import { getOracleDeployerForContext } from 'src/lib/oracle'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'oracle'

export const describe = 'destroy the oracle package'

type OracleDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: OracleDestroyArgv) => {
  const clusterManager = await switchToContextCluster(
    argv.celoEnv,
    argv.context,
    serviceName.Oracle
  )
  const deployer = getOracleDeployerForContext(
    argv.celoEnv,
    argv.context,
    false, // doesn't matter if we are using forno as we are just going to remove the chart
    clusterManager
  )
  await deployer.removeChart()
}
