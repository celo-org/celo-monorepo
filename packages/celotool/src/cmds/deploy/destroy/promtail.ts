import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removePromtail } from 'src/lib/promtail'

export const command = 'promtail'

export const describe = 'destroy promtail chart release on a kubernetes cluster using Helm'

export type PrometailDestroyArgv = DestroyArgv & ContextArgv

export const builder = (argv: PrometailDestroyArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: PrometailDestroyArgv) => {
  exitIfCelotoolHelmDryRun()

  await switchToClusterFromEnvOrContext(argv, true)

  await removePromtail()
}
