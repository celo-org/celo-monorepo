import { switchToClusterFromEnv } from 'src/lib/azure'
import { removeHelmRelease } from 'src/lib/oracle'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'oracle'

export const describe = 'destroy the oracle package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)

  await removeHelmRelease(argv.celoEnv)
}
