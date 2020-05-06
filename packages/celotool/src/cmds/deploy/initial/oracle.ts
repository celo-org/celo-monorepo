import { InitialArgv } from 'src/cmds/deploy/initial'
import {
  OracleArgv,
  addOracleMiddleware,
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
  await switchToAzureContextCluster(argv.primary, argv.celoEnv)
  if (false) {
    await installHelmChart(argv.celoEnv)
  }
}
