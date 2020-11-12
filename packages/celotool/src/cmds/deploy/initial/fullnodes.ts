import { InitialArgv } from 'src/cmds/deploy/initial'
import {
  addContextMiddleware,
  ContextArgv,
  serviceName,
  switchToContextCluster,
} from 'src/lib/context-utils'
import { installFullNodeChart } from 'src/lib/fullnodes'
import yargs from 'yargs'

export const command = 'fullnodes'

export const describe = 'deploy full-nodes in a particular context'

type FullNodeInitialArgv = InitialArgv &
  ContextArgv & {
    createNEG: boolean
    staticNodes: boolean
  }

export const builder = (argv: yargs.Argv) => {
  return addContextMiddleware(argv)
    .option('createNEG', {
      type: 'boolean',
      description:
        'When enabled, will create a network endpoint group for the full node http & ws ports. Only works for GCP.',
      default: false,
    })
    .option('staticNodes', {
      type: 'boolean',
      description:
        'when enabled, generates node keys deterministically using the mnemonic and context, and uploads the enodes to GCS',
      default: false,
    })
}

export const handler = async (argv: FullNodeInitialArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context, serviceName.Fullnode)
  await installFullNodeChart(argv.celoEnv, argv.context, argv.staticNodes, argv.createNEG)
}
