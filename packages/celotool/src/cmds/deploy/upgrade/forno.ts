import { UpgradeArgv } from 'src/cmds/deploy/upgrade'
import { deployForno } from 'src/lib/forno'

export const command = 'forno'

export const describe = 'Upgrade forno for an environment'

type FullNodeInitialArgv = UpgradeArgv

export const handler = async (argv: FullNodeInitialArgv) => {
  await deployForno(argv.celoEnv)
}
