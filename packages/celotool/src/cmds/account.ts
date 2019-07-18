import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/utils'
import * as yargs from 'yargs'

export const command = 'account <accountCommand>'

export const describe = 'commands for inviting, fauceting, looking up accounts and users'

export type AccountArgv = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv).commandDir('account', { extensions: ['ts'] })
}
export const handler = () => {
  // empty
}
