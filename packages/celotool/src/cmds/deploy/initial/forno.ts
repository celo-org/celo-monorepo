import { InitialArgv } from 'src/cmds/deploy/initial'
import { deployForno } from 'src/lib/forno'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'

export const command = 'forno'

export const describe = 'Deploy forno for an environment'

type FullNodeInitialArgv = InitialArgv

export const handler = async (argv: FullNodeInitialArgv) => {
  exitIfCelotoolHelmDryRun()
  await deployForno(argv.celoEnv)
}
