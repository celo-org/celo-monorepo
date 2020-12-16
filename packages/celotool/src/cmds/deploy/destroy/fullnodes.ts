import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { addContextMiddleware, ContextArgv, switchToContextCluster } from 'src/lib/context-utils'
import { removeFullNodeChart } from 'src/lib/fullnodes'
import { delinkSAForWorkloadIdentity, removeKubectlAnnotateKSA } from 'src/lib/gcloud_utils'

export const command = 'fullnodes'

export const describe = 'deploy full-nodes in a particular context'

type FullNodeDestroyArgv = DestroyArgv & ContextArgv

export const builder = addContextMiddleware

export const handler = async (argv: FullNodeDestroyArgv) => {
  await switchToContextCluster(argv.celoEnv, argv.context)
  await removeFullNodeChart(argv.celoEnv, argv.context)
  await removeKubectlAnnotateKSA(argv.celoEnv)
  await delinkSAForWorkloadIdentity(argv.celoEnv)
}
