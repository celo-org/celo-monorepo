import { InitialArgv } from 'src/cmds/deploy/initial'
import {
  addContextMiddleware,
  ContextArgv,
  serviceName,
  switchToContextCluster,
} from 'src/lib/context-utils'
import { installHelmChart } from 'src/lib/komenci'
import yargs from 'yargs'

export const command = 'komenci'

export const describe = 'deploy the komenci for the specified network'

type KomenciInitialArgv = InitialArgv &
  ContextArgv & {
    useForno: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv).option('useForno', {
    description: 'Uses forno for RPCs from the komenci clients',
    default: false,
    type: 'boolean',
  })
}

export const handler = async (argv: KomenciInitialArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context, serviceName.Komenci)
  await installHelmChart(argv.celoEnv, argv.context, argv.useForno)
}
