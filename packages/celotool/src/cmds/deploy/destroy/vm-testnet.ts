import { switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/prometheus'
import { destroy } from 'src/lib/vm-testnet-utils'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'vm-testnet'
export const describe = 'destroy an existing VM-based testnet'
export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await destroy(argv.celoEnv)
  await removeHelmRelease()
}
