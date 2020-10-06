import { InitialArgv } from 'src/cmds/deploy/initial'
import {
  addOracleMiddleware,
  installHelmChart,
  OracleArgv,
  switchToAzureContextCluster,
} from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'deploy the oracle for the specified network'

type OracleInitialArgv = InitialArgv &
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

export const handler = async (argv: OracleInitialArgv) => {
  await switchToAzureContextCluster(argv.celoEnv, argv.context)
  await installHelmChart(argv.celoEnv, argv.context, argv.useForno)
}
