import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { installHelmChart } from 'src/lib/funder'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import yargs from 'yargs'

export const command = 'funder'

export const describe = 'deploy the Address Funder app for the specified network'

type FunderInitialArgv = InitialArgv &
  ContextArgv & {
    useForno: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv).option('useForno', {
    description: 'Uses forno for RPCs from the funder service',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: FunderInitialArgv) => {
  // Do not allow --helmdryrun because komenciIdentityHelmParameters function. It could be refactored to allow
  exitIfCelotoolHelmDryRun()
  await switchToContextCluster(argv.celoEnv, argv.context)
  await installHelmChart(argv.celoEnv, argv.context, argv.useForno)
}
