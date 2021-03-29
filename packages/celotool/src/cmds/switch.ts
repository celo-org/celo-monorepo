import { switchToClusterFromEnv } from 'src/lib/cluster'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import yargs from 'yargs'

export const command = 'switch'

export const describe = 'command for switching to a particular environment'

// sets environment variables from .env
export const builder = (argv: yargs.Argv) => addCeloEnvMiddleware(argv)

export const handler = async (argv: CeloEnvArgv) => {
  await switchToClusterFromEnv(argv.celoEnv, false, true)
}
