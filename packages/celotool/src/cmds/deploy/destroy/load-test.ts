import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { removeHelmRelease } from 'src/lib/load-test'

export const command = 'load-test'

export const describe = 'destroy load-test deployment'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
