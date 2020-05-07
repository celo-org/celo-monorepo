import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { removeHelmRelease } from 'src/lib/aks-fullnode'
import {
  addOracleMiddleware,
  getAzureClusterConfig,
  getOracleAzureContext,
  OracleArgv,
  switchToAzureContextCluster,
} from 'src/lib/oracle'

export const command = 'oracle-fullnode'

export const describe = 'destroy the oracle full-node(s) on an AKS cluster'

type OracleFullNodeDestroyArgv = DestroyArgv & OracleArgv

export const builder = addOracleMiddleware

export const handler = async (argv: OracleFullNodeDestroyArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  const clusterConfig = getAzureClusterConfig(oracleAzureContext)
  await removeHelmRelease(argv.celoEnv, clusterConfig)
}
