import { DeployArgv } from '@celo/celotool/src/cmds/deploy'
import * as yargs from 'yargs'
export const command = 'destroy <deployPackage>'

export const describe = 'destroy an existing deploy'

export type DestroyArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('destroy', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
