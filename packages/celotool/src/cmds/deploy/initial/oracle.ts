import { InitialArgv } from 'src/cmds/deploy/initial'
import {
  OracleArgv,
  addOracleMiddleware,
  getOracleAzureContext,
  installHelmChart,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'deploy the oracle for the specified network'

type OracleInitialArgv = InitialArgv & OracleArgv

export const builder = (argv: yargs.Argv) => {
  return addOracleMiddleware(argv)
}

export const handler = async (argv: OracleInitialArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(oracleAzureContext, argv.celoEnv)
  if (false) {
    await installHelmChart(argv.celoEnv, oracleAzureContext)
  }
}
