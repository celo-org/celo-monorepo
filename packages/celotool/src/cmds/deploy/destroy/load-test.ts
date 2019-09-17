import { switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/load-test'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'load-test'

export const describe = 'destroy load-test deployment'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
