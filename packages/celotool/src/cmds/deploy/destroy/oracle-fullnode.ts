import { DestroyArgv } from 'src/cmds/deploy/destroy'
import {
  addOracleMiddleware,
  getOracleAzureContext,
  OracleArgv,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
import { removeOracleFullNodeChart } from 'src/lib/oracle-fullnode'

export const command = 'oracle-fullnode'

export const describe = 'destroy the oracle full-node(s) on an AKS cluster'

type OracleFullNodeDestroyArgv = DestroyArgv & OracleArgv

export const builder = addOracleMiddleware

export const handler = async (argv: OracleFullNodeDestroyArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  await removeOracleFullNodeChart(argv.celoEnv, oracleAzureContext)
}
