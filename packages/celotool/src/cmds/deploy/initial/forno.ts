import { InitialArgv } from 'src/cmds/deploy/initial'
import { deployForno } from 'src/lib/forno'

export const command = 'forno'

export const describe = 'Deploy forno for an environment'

type FullNodeInitialArgv = InitialArgv

export const handler = async (argv: FullNodeInitialArgv) => {
  await deployForno(argv.celoEnv)
}
