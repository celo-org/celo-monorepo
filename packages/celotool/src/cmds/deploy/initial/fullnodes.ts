import { InitialArgv } from 'src/cmds/deploy/initial'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { installFullNodeChart } from 'src/lib/fullnodes'
import { kubectlAnnotateKSA, linkSAForWorkloadIdentity } from 'src/lib/gcloud_utils'
import { isCelotoolHelmDryRun } from 'src/lib/helm_deploy'
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
  await switchToContextCluster(argv.celoEnv, argv.context)
  if (!isCelotoolHelmDryRun()) {
    await linkSAForWorkloadIdentity(argv.celoEnv, argv.context)
  } else {
    console.info(`Skipping Workload Identity Service account setup due to --helmdryrun.`)
  }
  await installFullNodeChart(argv.celoEnv, argv.context, argv.staticNodes, argv.createNEG)
  if (!isCelotoolHelmDryRun()) {
    await kubectlAnnotateKSA(argv.celoEnv, argv.context)
  }
}
