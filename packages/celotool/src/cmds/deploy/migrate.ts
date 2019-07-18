import { DeployArgv } from '@celo/celotool/src/cmds/deploy'
import * as yargs from 'yargs'
export const command = 'migrate <deployPackage>'

export const describe = 'migrate an existing deploy'

export type MigrateArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('migrate', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
