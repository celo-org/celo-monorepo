import * as yargs from 'yargs'

export const command = 'geth <command>'

export const describe = 'commands for geth'

export interface GethArgv extends yargs.Argv {
  gethDir: string
  dataDir: string
}

export const builder = (argv: yargs.Argv) => {
  return argv.commandDir('geth', { extensions: ['ts'] })
}

export const handler = () => {
  // empty
}
