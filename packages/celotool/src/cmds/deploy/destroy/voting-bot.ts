import { switchToClusterFromEnv } from 'src/lib/cluster'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { removeHelmRelease } from 'src/lib/voting-bot'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'voting-bot'

export const describe = 'destroy the voting bot package'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
