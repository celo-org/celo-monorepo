import { DeployArgv } from '@celo/celotool/src/cmds/deploy'
import * as yargs from 'yargs'
export const command = 'upgrade <deployPackage>'

export const describe = 'upgrade an existing deploy'

export type UpgradeArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('upgrade', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
