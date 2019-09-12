import * as yargs from 'yargs'
import { addCeloEnvMiddleware, CeloEnvArgv } from '../lib/env-utils'

export const command = 'account <accountCommand>'

export const describe = 'commands for inviting, fauceting, looking up accounts and users'

export type AccountArgv = CeloEnvArgv

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv).commandDir('account', { extensions: ['ts'] })
}
export const handler = () => {
  // empty
}
