import yargs from 'yargs'
import { DeployArgv } from 'src/cmds/deploy'
export const command = 'switch <deployPackage>'

export const describe = 'switch the exposed deployed service'

export type SwitchArgv = DeployArgv

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('switch', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
