import { switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/eksportisto'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'eksportisto'

export const describe = 'destroy the eksportisto deploy'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
