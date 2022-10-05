import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { upgradePromtail } from 'src/lib/promtail'

export const command = 'promtail'

export const describe = 'upgrade Promtail to a kubernetes cluster using Helm'

export type PromtailUpgradeArgv = UpgradeArgv & ContextArgv

export const builder = (argv: PromtailUpgradeArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: PromtailUpgradeArgv) => {
  // always skip cluster setup
  const clusterConfig = await switchToClusterFromEnvOrContext(argv, true)

  await upgradePromtail(clusterConfig)
}
