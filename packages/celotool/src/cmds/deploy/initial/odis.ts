import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { installODISHelmChart } from 'src/lib/odis'
import yargs from 'yargs'

export const command = 'odis'

export const describe = 'deploy the odis signers for the specified network'

type OdisInitialArgv = InitialArgv & ContextArgv

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: OdisInitialArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await installODISHelmChart(argv.celoEnv, argv.context)
}
