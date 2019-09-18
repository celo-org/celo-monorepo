import { destroy } from 'src/lib/vm-testnet-utils'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'vm-testnet'
export const describe = 'destroy an existing VM-based testnet'
export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await destroy(argv.celoEnv)
}
