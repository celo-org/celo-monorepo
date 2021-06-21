import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { upgradeFullNodeChart } from 'src/lib/fullnodes'
import { kubectlAnnotateKSA, linkSAForWorkloadIdentity } from 'src/lib/gcloud_utils'
import { isCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import yargs from 'yargs'

export const command = 'fullnodes'

export const describe = 'deploy full nodes in a particular context'

type FullNodeUpgradeArgv = UpgradeArgv &
  ContextArgv & {
    createNEG: boolean
    reset: boolean
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
    .option('reset', {
      type: 'boolean',
      description: 'when enabled, deletes the data volumes and redeploys the helm chart.',
      default: false,
    })
    .option('staticNodes', {
      type: 'boolean',
      description:
        'when enabled, generates node keys deterministically using the mnemonic and context, and uploads the enodes to GCS',
      default: false,
    })
}

export const handler = async (argv: FullNodeUpgradeArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  if (!isCelotoolHelmDryRun()) {
    await linkSAForWorkloadIdentity(argv.celoEnv, argv.context)
  }
  await upgradeFullNodeChart(
    argv.celoEnv,
    argv.context,
    argv.reset,
    argv.staticNodes,
    argv.createNEG
  )
  if (!isCelotoolHelmDryRun()) {
    await kubectlAnnotateKSA(argv.celoEnv, argv.context)
  }
}
