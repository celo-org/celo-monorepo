import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { deploy } from '@celo/celotool/src/lib/vm-testnet-utils'

export const command = 'vm-testnet'
export const describe = 'upgrade a testnet on a VM'
export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await deploy(argv.celoEnv)
}
