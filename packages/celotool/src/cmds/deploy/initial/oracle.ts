import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { installHelmChart, getOracleDeployerForContext } from 'src/lib/oracle'
import yargs from 'yargs'

export const command = 'oracle'

export const describe = 'deploy the oracle for the specified network'

type OracleInitialArgv = InitialArgv &
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

export const handler = async (argv: OracleInitialArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  if (false) {
    await installHelmChart(argv.celoEnv, argv.context, argv.useForno)
  }
  const deployer = await getOracleDeployerForContext(argv.celoEnv, argv.context, argv.useForno)
  await deployer.installChart()
}
