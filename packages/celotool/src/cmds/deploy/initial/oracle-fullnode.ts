import { InitialArgv } from 'src/cmds/deploy/initial'
import {
  addOracleMiddleware,
  getOracleAzureContext,
  OracleArgv,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
import { installOracleFullNodeChart } from 'src/lib/oracle-fullnode'

export const command = 'oracle-fullnode'

export const describe = 'deploy the oracle full-node(s) on an AKS cluster'

type OracleFullNodeInitialArgv = InitialArgv & OracleArgv

export const builder = addOracleMiddleware

export const handler = async (argv: OracleFullNodeInitialArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  await installOracleFullNodeChart(argv.celoEnv, oracleAzureContext)
}
