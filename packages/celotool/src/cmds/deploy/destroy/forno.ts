import { DestroyArgv } from 'src/cmds/deploy/destroy'
import { destroyForno } from 'src/lib/forno'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'

export const command = 'forno'

export const describe = 'Destroy forno for an environment'

type FullNodeInitialArgv = DestroyArgv

export const handler = async (argv: FullNodeInitialArgv) => {
  exitIfCelotoolHelmDryRun()
  await destroyForno(argv.celoEnv)
}
