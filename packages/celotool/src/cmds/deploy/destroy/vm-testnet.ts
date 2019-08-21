import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { destroy } from '@celo/celotool/src/lib/vm-testnet-utils'

export const command = 'vm-testnet'
export const describe = 'destroy an existing VM-based testnet'
export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await destroy(argv.celoEnv)
}
