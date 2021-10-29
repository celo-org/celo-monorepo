import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { installPromtailIfNotExists } from 'src/lib/promtail'

export const command = 'promtail'

export const describe = 'deploy Promtail to a kubernetes cluster using Helm'

export type PromtailInitialArgv = InitialArgv & ContextArgv

export const builder = (argv: PromtailInitialArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: PromtailInitialArgv) => {
  // always skip cluster setup
  const clusterConfig = await switchToClusterFromEnvOrContext(argv, true)

  await installPromtailIfNotExists(clusterConfig)
}
