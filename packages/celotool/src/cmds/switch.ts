import { addCeloEnvMiddleware } from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'

export const command = 'switch'

export const describe = 'command for switching to a particular environment'

// sets environment variables from .env
export const builder = (argv: yargs.Argv) => addCeloEnvMiddleware(argv)

export const handler = async () => {
  await switchToClusterFromEnv(false)
}
