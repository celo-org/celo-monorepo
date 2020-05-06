import { InitialArgv } from 'src/cmds/deploy/initial'
import { installFullNodeChart } from 'src/lib/aks-fullnode'
import {
  OracleArgv,
  addOracleMiddleware,
  getAzureClusterConfig,
  getOracleAzureContext,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle-fullnode'

export const describe = 'deploy full-node(s) on an AKS cluster'

type OracleFullNodeInitialArgv = InitialArgv & OracleArgv

export const builder = (argv: yargs.Argv) => {
  return addOracleMiddleware(argv)
}

export const handler = async (argv: OracleFullNodeInitialArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(argv.celoEnv, oracleAzureContext)
  const clusterConfig = getAzureClusterConfig(oracleAzureContext)
  await installFullNodeChart(argv.celoEnv, clusterConfig)
}
