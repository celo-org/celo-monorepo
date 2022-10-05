import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { upgradeKong, upgradeKonga } from 'src/lib/kong'

export const command = 'kong'

export const describe = 'upgrade Kong and Konga packages'

export type KongUpgradeArgv = UpgradeArgv & ContextArgv

export const builder = (argv: KongUpgradeArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: KongUpgradeArgv) => {
  await switchToClusterFromEnvOrContext(argv, true)
  await upgradeKong(argv.celoEnv)
  await upgradeKonga(argv.celoEnv)
}
