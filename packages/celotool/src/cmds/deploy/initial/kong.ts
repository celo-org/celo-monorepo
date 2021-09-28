import { InitialArgv } from 'src/cmds/deploy/initial'
import { switchToClusterFromEnvOrContext } from 'src/lib/cluster'
import { addContextMiddleware, ContextArgv } from 'src/lib/context-utils'
import { installKong, installKonga } from 'src/lib/kong'

export const command = 'kong'

export const describe = 'deploy Kong and Konga packages'

export type KongInitialArgv = InitialArgv & ContextArgv

export const builder = (argv: KongInitialArgv) => {
  return addContextMiddleware(argv)
}

export const handler = async (argv: KongInitialArgv) => {
  await switchToClusterFromEnvOrContext(argv, true)
  await installKong(argv.celoEnv)
  await installKonga(argv.celoEnv)
}
