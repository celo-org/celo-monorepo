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

type OracleInitialArgv = InitialArgv &
  OracleArgv & {
    useFullNodes: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addOracleMiddleware(argv).option('useFullNodes', {
    description: 'Uses previously deployed full nodes in the same namespace for RPCs',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: OracleInitialArgv) => {
  const oracleAzureContext = getOracleAzureContext(argv.primary)
  await switchToAzureContextCluster(oracleAzureContext, argv.celoEnv)
  if (false) {
    await installHelmChart(argv.celoEnv, oracleAzureContext, argv.useFullNodes)
  }
}
