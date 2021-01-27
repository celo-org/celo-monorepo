import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { destroyForno } from 'src/lib/forno'

export const command = 'forno'

export const describe = 'Destroy forno for an environment'

type FullNodeInitialArgv = DestroyArgv

export const handler = async (argv: FullNodeInitialArgv) => {
  await destroyForno(argv.celoEnv)
}
